<?php

namespace App\Helpers;

use App\Jobs\RevertSequenceJob;
use App\Models\Branch;
use App\Models\SequenceStatus;
use App\Models\TransactionPrefix;
use App\Models\TransactionSequence;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TransactionCode
{
    public static function generateTransactionCode($transactionType)
    {
        $sourceAbleType = null;
        $sourceAbleId = null;

        $prefix = Cache::remember('transaction_prefix_' . $transactionType, 3600, function () use ($transactionType) {
            return TransactionPrefix::where('transaction_type', $transactionType)->first();
        });

        if (!$prefix) {
            throw new \Exception('Kode transaksi tidak tersedia.');
        }

        $isSourceAbleSpecific = in_array($transactionType, ['Stock Audit', 'Stock Adjustment', 'Sales Order', 'Waybill', 'Sales Invoice', 'Sales Invoice Payment', 'Expense']);
        $isNoSourceAble = in_array($transactionType, ['Stock Transfer', 'Purchase Order', 'Purchase Invoice Payment']);

        if ($isSourceAbleSpecific) {
            if (!request()->has('source_able_type') || !request()->has('source_able_id')) {
                throw new \Exception('Tipe sumber dan ID sumber harus dipilih untuk generate kode transaksi.');
            }

            $sourceAbleMapping = [
                'branch' => \App\Models\Branch::class,
                'warehouse' => \App\Models\Warehouse::class,
            ];

            $requestedSourceType = request()->input('source_able_type');

            if (!array_key_exists($requestedSourceType, $sourceAbleMapping)) {
                throw new \Exception('Tipe sumber tidak valid.');
            }

            $sourceAbleType = $sourceAbleMapping[$requestedSourceType];
            $sourceAbleId = request()->input('source_able_id');
        } elseif ($isNoSourceAble) {
            $sourceAbleType = null;
            $sourceAbleId = null;
        } elseif ($isSourceAbleSpecific && !auth()->user()->branch_id) {
            throw new \Exception('Anda tidak memiliki akses ke transaksi ini.');
        }

        $year = Carbon::now()->format('y');
        $month = Carbon::now()->format('m');

        $transactionCode = DB::transaction(function () use ($transactionType, $prefix, $year, $month, $isSourceAbleSpecific, $isNoSourceAble, $sourceAbleType, $sourceAbleId) {
            $availableSequence = SequenceStatus::whereHas('transactionSequence', function ($query) use ($prefix, $year, $month, $isSourceAbleSpecific, $isNoSourceAble, $sourceAbleType, $sourceAbleId) {
                $query->where('transaction_prefix_id', $prefix->id)
                    ->where('month', $month)
                    ->where('year', $year);

                // Filter berdasarkan source_able_type dan source_able_id jika diperlukan
                if ($isSourceAbleSpecific && !$isNoSourceAble) {
                    $query->where('source_able_type', $sourceAbleType)
                        ->where('source_able_id', $sourceAbleId);
                }
            })
                ->where(function ($query) use ($prefix, $year, $month, $sourceAbleType, $sourceAbleId, $isSourceAbleSpecific, $isNoSourceAble) {
                    $query->where('status', 'reserved')
                        ->where('user_id', auth()->user()->id)
                        ->where('expires_at', '>', now())
                        ->whereIn('transaction_sequence_id', function ($subQuery) use ($prefix, $year, $month, $isSourceAbleSpecific, $isNoSourceAble, $sourceAbleType, $sourceAbleId) {
                            $subQuery->select('id')
                                ->from('transaction_sequences')
                                ->where('transaction_prefix_id', $prefix->id)
                                ->where('month', $month)
                                ->where('year', $year);

                            if ($isSourceAbleSpecific && !$isNoSourceAble) {
                                $subQuery->where('source_able_type', $sourceAbleType)
                                    ->where('source_able_id', $sourceAbleId);
                            }
                        });
                })
                ->orWhere(function ($query) use ($prefix, $year, $month, $sourceAbleType, $sourceAbleId, $isSourceAbleSpecific, $isNoSourceAble) {
                    $query->where('status', 'available')
                        ->whereIn('transaction_sequence_id', function ($subQuery) use ($prefix, $year, $month, $isSourceAbleSpecific, $isNoSourceAble, $sourceAbleType, $sourceAbleId) {
                            $subQuery->select('id')
                                ->from('transaction_sequences')
                                ->where('transaction_prefix_id', $prefix->id)
                                ->where('month', $month)
                                ->where('year', $year);

                            if ($isSourceAbleSpecific && !$isNoSourceAble) {
                                $subQuery->where('source_able_type', $sourceAbleType)
                                    ->where('source_able_id', $sourceAbleId);
                            }
                        });
                })
                ->orderBy('sequence_number', 'asc')
                ->lockForUpdate()
                ->first();

            if ($availableSequence) {
                $availableSequence->update([
                    'status' => 'reserved',
                    'user_id' => auth()->user()->id,
                    'expires_at' => now()->addHour()
                ]);
                $jobs = DB::table('jobs')->get();
                self::updateJobs($jobs, $availableSequence);

                $sequenceNumber = $availableSequence->sequence_number;
            } else {
                $existingTransactionSequence = TransactionSequence::where('transaction_prefix_id', $prefix->id)
                    ->where('month', $month)
                    ->where('year', $year)
                    ->when($isSourceAbleSpecific && !$isNoSourceAble, function ($query) use ($sourceAbleType, $sourceAbleId) {
                        $query->where('source_able_type', $sourceAbleType)
                            ->where('source_able_id', $sourceAbleId);
                    })
                    ->lockForUpdate()
                    ->first();

                if (!$existingTransactionSequence) {
                    $sequenceNumber = 1;

                    $existingTransactionSequence = TransactionSequence::create([
                        'source_able_type' => ($isSourceAbleSpecific && !$isNoSourceAble) ? $sourceAbleType : null,
                        'source_able_id'   => ($isSourceAbleSpecific && !$isNoSourceAble) ? $sourceAbleId : null,
                        'transaction_prefix_id' => $prefix->id,
                        'month' => $month,
                        'year' => $year,
                        'sequence' => $sequenceNumber
                    ]);
                } else {
                    $existingTransactionSequence->increment('sequence');
                    $sequenceNumber = $existingTransactionSequence->sequence;
                }

                $sequence = SequenceStatus::create([
                    'transaction_sequence_id' => $existingTransactionSequence->id,
                    'user_id' => auth()->user()->id,
                    'sequence_number' => $sequenceNumber,
                    'status' => 'reserved',
                    'expires_at' => now()->addHour()
                ]);

                RevertSequenceJob::dispatch($sequence->id)->delay(now()->addHour());
            }

            if ($isSourceAbleSpecific && $sourceAbleType === \App\Models\Branch::class) {
                $branchInitial = Cache::remember('branch_initial_' . $sourceAbleId, 3600, function () use ($sourceAbleId) {
                    return Branch::where('id', $sourceAbleId)->value('initial');
                });

                if (!$branchInitial) {
                    throw new \Exception('Inisial outlet tidak ditemukan.');
                }

                return sprintf('%s-%s-%s%s-%04d', $prefix->prefix_code, $branchInitial, $year, $month, $sequenceNumber);
            }

            return sprintf('%s-%s%s-%04d', $prefix->prefix_code, $year, $month, $sequenceNumber);
        });

        return $transactionCode;
    }

    public static function confirmTransactionCode($transactionType, $code, $sourceType = null, $sourceId = null)
    {
        return DB::transaction(function () use ($transactionType, $code, $sourceType, $sourceId) {
            $sequenceNumber = (int) Str::afterLast($code, '-');

            $sequence = SequenceStatus::whereHas('transactionSequence.transactionPrefix', function ($query) use ($transactionType) {
                $query->where('transaction_type', $transactionType);
            })
                ->whereHas('transactionSequence', function ($query) use ($sourceType, $sourceId) {
                    if ($sourceType && $sourceId) {
                        $query->where('source_able_id', $sourceId)
                            ->where('source_able_type', $sourceType);
                    }
                })
                ->where('sequence_number', $sequenceNumber)
                ->where('user_id', auth()->user()->id)
                ->where('status', 'reserved')
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                throw new \Exception('Kode transaksi tidak dapat dikonfirmasi karena tidak ditemukan atau telah kedaluwarsa.');
            }

            $sequence->update([
                'status' => 'confirmed',
                'user_id' => auth()->user()->id,
                'updated_at' => now(),
            ]);

            $jobs = DB::table('jobs')->get();
            self::deleteJobs($jobs, $sequence->id);
        });
    }

    private static function updateJobs($jobs, $sequence)
    {
        $updated = false;

        // Log sebelum mencoba update jobs
        Log::info("Attempting to update jobs for sequenceId: {$sequence->id}, expires_at: {$sequence->expires_at}");

        // Parse waktu expires_at sequence
        $expiryTime = Carbon::parse($sequence->expires_at);

        // Log waktu saat ini dan waktu kedaluwarsa untuk debugging
        Log::info("Timing information", [
            'current_time' => now()->toDateTimeString(),
            'sequence_expires_at' => $expiryTime->toDateTimeString(),
            'difference_seconds' => $expiryTime->diffInSeconds(now()),
            'expires_in_future' => $expiryTime->gt(now()) ? 'Yes' : 'No'
        ]);

        foreach ($jobs as $job) {
            try {
                $payload = json_decode($job->payload, true);

                if (!isset($payload['data']['command'])) {
                    continue;
                }

                $commandData = unserialize($payload['data']['command']);

                if (isset($commandData->sequenceId) && $commandData->sequenceId == $sequence->id) {
                    // Log sebelum update
                    Log::info("Found job to update - Job ID: {$job->id}, SequenceId: {$sequence->id}");

                    DB::beginTransaction();
                    try {
                        // Ambil data job dengan lock untuk update
                        $beforeJob = DB::table('jobs')->where('id', $job->id)->lockForUpdate()->first();

                        if (!$beforeJob) {
                            Log::warning("Job not found or already processed - Job ID: {$job->id}");
                            DB::rollBack();
                            continue;
                        }

                        Log::info("Job before update:", [
                            'job_id' => $beforeJob->id,
                            'available_at' => date('Y-m-d H:i:s', $beforeJob->available_at)
                        ]);

                        // Hitung delay yang benar
                        // Gunakan waktu kedaluwarsa langsung jika masih di masa depan
                        // Jika sudah lewat, gunakan delay minimal (misalnya 30 detik dari sekarang)
                        if ($expiryTime->gt(now())) {
                            // Jika waktu kedaluwarsa masih di masa depan
                            $newAvailableAt = $expiryTime->getTimestamp();
                        } else {
                            // Jika waktu kedaluwarsa sudah lewat, tambahkan delay minimal
                            $newAvailableAt = now()->addSeconds(30)->getTimestamp();
                        }

                        // Log perhitungan delay untuk debugging
                        Log::info("Delay calculation", [
                            'job_id' => $job->id,
                            'new_available_at' => date('Y-m-d H:i:s', $newAvailableAt),
                            'current_time' => now()->toDateTimeString(),
                            'is_in_future' => ($newAvailableAt > now()->getTimestamp()) ? 'Yes' : 'No'
                        ]);

                        // Update job
                        $updateResult = DB::table('jobs')
                            ->where('id', $job->id)
                            ->update([
                                'available_at' => $newAvailableAt,
                            ]);

                        // Verifikasi update berhasil dengan query baru
                        $afterJob = DB::table('jobs')->where('id', $job->id)->first();

                        if ($afterJob) {
                            DB::commit();
                            Log::info("Job updated successfully", [
                                'job_id' => $job->id,
                                'update_result' => $updateResult,
                                'new_available_at' => date('Y-m-d H:i:s', $afterJob->available_at),
                                'sequence_expires_at' => $sequence->expires_at
                            ]);
                            $updated = true;
                        } else {
                            DB::rollBack();
                            Log::error("Job disappeared during update transaction", ['job_id' => $job->id]);
                        }
                    } catch (\Exception $e) {
                        DB::rollBack();
                        Log::error("Transaction error for job {$job->id}: " . $e->getMessage(), [
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error("Error processing job {$job->id}: " . $e->getMessage(), [
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        if (!$updated) {
            Log::info("No existing jobs found or updated, dispatching new RevertSequenceJob for sequenceId: {$sequence->id}");
            RevertSequenceJob::dispatch($sequence->id)->delay(now()->addHour());
        }

        return $updated;
    }

    private static function deleteJobs($jobs, $sequenceId)
    {
        Log::info("Deleting jobs for sequenceId: {$sequenceId}");
        foreach ($jobs as $job) {
            $payload = json_decode($job->payload, true);
            Log::info("Job ID {$job->id} payload:", $payload);

            if (!isset($payload['data']['command'])) {
                \Log::warning("No command found in job payload for job ID: {$job->id}");
                continue;
            }

            try {
                $commandData = unserialize($payload['data']['command']);

                if (isset($commandData->sequenceId) && $commandData->sequenceId == $sequenceId) {
                    DB::table('jobs')->where('id', $job->id)->delete();
                    \Log::info("Deleted job with ID: {$job->id} for sequenceId: {$sequenceId}");
                } else {
                    \Log::info("Job ID {$job->id} sequenceId does not match. Found: {$commandData->sequenceId}, Expected: {$sequenceId}");
                }
            } catch (\Exception $e) {
                \Log::error("Error unserializing job ID {$job->id}: " . $e->getMessage());
            }
        }
    }

    public static function cancelTransactionCode($transactionType, $code, $sourceId = null, $sourceType = null)
    {
        return DB::transaction(function () use ($sourceType, $sourceId, $transactionType, $code) {
            $sequenceNumber = (int) Str::afterLast($code, '-');

            $sequence = SequenceStatus::whereHas('transactionSequence.transactionPrefix', function ($query) use ($transactionType) {
                $query->where('transaction_type', $transactionType);
            })
                ->when($sourceId && $sourceType, function ($query) use ($sourceId, $sourceType) {
                    $query->whereHas('transactionSequence', function ($subQuery) use ($sourceId, $sourceType) {
                        $subQuery->where('source_able_type', $sourceType)
                            ->where('source_able_id', $sourceId);
                    });
                })
                ->where('sequence_number', $sequenceNumber)
                ->where('user_id', auth()->user()->id)
                ->where('status', 'confirmed')
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                throw new \Exception('Kode transaksi tidak dapat dibatalkan karena tidak ditemukan atau telah kedaluwarsa.');
            }

            $sequence->update([
                'status' => 'available',
                'user_id' => null,
                'updated_at' => now(),
            ]);

        });
    }
}
