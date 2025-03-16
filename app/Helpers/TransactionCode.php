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

        $isSourceAbleSpecific = in_array($transactionType, ['Stock Audit', 'Stock Adjustment', 'Purchase Invoice Payment', 'Sales Order', 'Waybill', 'Sales Invoice', 'Sales Invoice Payment', 'Expense']);
        $isNoSourceAble = in_array($transactionType, ['Stock Transfer', 'Purchase Order']);

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
        foreach ($jobs as $job) {
            $payload = json_decode($job->payload, true);

            if (!isset($payload['data']['command'])) {
                continue;
            }

            $commandData = unserialize($payload['data']['command']);

            if (isset($commandData->sequenceId) && $commandData->sequenceId == $sequence->id) {

                $newDelay = Carbon::parse($sequence->expires_at)->diffInSeconds(now());

                $commandData->expires_at = $sequence->expires_at;
                $updatedCommand = serialize($commandData);

                $payload['data']['command'] = $updatedCommand;
                DB::table('jobs')->where('id', $job->id)->update([
                    'payload' => json_encode($payload),
                    'available_at' => now()->addSeconds($newDelay)->getTimestamp(),
                ]);

                \Log::info("Job ID {$job->id} updated for sequenceId {$sequence->id} with new expires_at: {$sequence->expires_at}");

                $updated = true;
            }
        }

        if (!$updated) {
            RevertSequenceJob::dispatch($sequence->id)->delay(now()->addHour());
        }
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
