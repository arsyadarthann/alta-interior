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
        $branchId = null;

        $prefix = Cache::remember('transaction_prefix_' . $transactionType, 3600, function () use ($transactionType) {
            return TransactionPrefix::where('transaction_type', $transactionType)->first();
        });

        if (!$prefix) {
            throw new \Exception('Kode transaksi tidak tersedia.');
        }

        $isBranchSpecific = in_array($transactionType, ['Purchase Order', 'Stock Transfer', 'Stock Audit', 'Stock Adjustment', 'Purchase Invoice Payment', 'Sales Order', 'Waybill', 'Sales Invoice', 'Sales Invoice Payment', 'Expense']);
        if ($isBranchSpecific) {
            if (!auth()->user()->branch_id) {
                if (request()->branch_id) {
                    $branchId = request()->branch_id;
                } else {
                    throw new \Exception('Cabang harus dipilih untuk generate kode transaksi');
                }
            } else {
                $branchId = auth()->user()->branch_id;
            }
        } else if ($isBranchSpecific && !auth()->user()->branch_id) {
            throw new \Exception('Anda tidak memiliki akses ke transaksi ini.');
        } else {
            $branchId = auth()->user()->branch_id;
        }


        $year = Carbon::now()->format('y');
        $month = Carbon::now()->format('m');

        $transactionCode = DB::transaction(function () use ($transactionType, $prefix, $year, $month, $isBranchSpecific, $branchId) {
            $availableSequence = SequenceStatus::whereHas('transactionSequence', function ($query) use ($transactionType, $prefix, $year, $month, $isBranchSpecific, $branchId) {
                $query->where('transaction_prefix_id', $prefix->id)
                    ->where('month', $month)
                    ->where('year', $year);

                if ($isBranchSpecific) {
                    $query->where('branch_id', $branchId);
                }
            })
                ->where(function ($query) use ($transactionType, $prefix, $year, $month, $branchId, $isBranchSpecific) {
                    $query->where('status', 'reserved')
                        ->where('user_id', auth()->user()->id)
                        ->where('expires_at', '>', now())
                        ->whereIn('transaction_sequence_id', function ($subQuery) use ($prefix, $year, $month, $isBranchSpecific, $branchId) {
                            $subQuery->select('id')
                                ->from('transaction_sequences')
                                ->where('transaction_prefix_id', $prefix->id)
                                ->where('month', $month)
                                ->where('year', $year);

                            if ($isBranchSpecific) {
                                $subQuery->where('branch_id', $branchId);
                            }
                        });
                })
                ->orWhere(function ($query) use ($transactionType, $prefix, $year, $month, $branchId, $isBranchSpecific) {
                    $query->where('status', 'available')
                        ->whereIn('transaction_sequence_id', function ($subQuery) use ($transactionType, $prefix, $year, $month, $isBranchSpecific, $branchId) {
                            $subQuery->select('id')
                                ->from('transaction_sequences')
                                ->where('transaction_prefix_id', $prefix->id)
                                ->where('month', $month)
                                ->where('year', $year);

                            if ($isBranchSpecific) {
                                $subQuery->where('branch_id', $branchId);
                            }
                        })
                        ->whereDoesntHave('user');
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
                    ->when($isBranchSpecific, function ($query) use ($branchId) {
                        $query->where('branch_id', $branchId);
                    })
                    ->lockForUpdate()
                    ->first();

                if (!$existingTransactionSequence) {
                    $sequenceNumber = 1;

                    $existingTransactionSequence = TransactionSequence::create([
                        'branch_id' => $isBranchSpecific ? $branchId : null,
                        'transaction_prefix_id' => $prefix->id,
                        'month' => $month,
                        'year' => $year,
                        'sequence' => $sequenceNumber
                    ]);
                } else {
                    $existingTransactionSequence->increment('sequence');
                    $existingTransactionSequence = TransactionSequence::find($existingTransactionSequence->id);
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

            if ($isBranchSpecific) {
                $branchInitial = Cache::remember('branch_initial_' . $branchId, 3600, function () use ($branchId) {
                    return Branch::where('id', $branchId)->value('initial');
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

    public static function confirmTransactionCode($transactionType, $code, $branchId = null)
    {
        return DB::transaction(function () use ($transactionType, $code, $branchId) {
            $sequenceNumber = (int) Str::afterLast($code, '-');

            $sequence = SequenceStatus::whereHas('transactionSequence.transactionPrefix', function ($query) use ($transactionType) {
                $query->where('transaction_type', $transactionType);
            })
                ->whereHas('transactionSequence', function ($query) use ($branchId) {
                    if ($branchId) {
                        $query->where('branch_id', $branchId);
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

    public static function cancelTransactionCode($transactionType, $code)
    {
        return DB::transaction(function () use ($transactionType, $code) {
            $sequenceNumber = (int) Str::afterLast($code, '-');

            $sequence = SequenceStatus::whereHas('transactionSequence.transactionPrefix', function ($query) use ($transactionType, $sequenceNumber) {
                $query->where('transaction_type', $transactionType);
            })
                ->where('sequence_number', $sequenceNumber)
                ->where('user_id', auth()->user()->id)
                ->where('status', 'confirmed')
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                throw new \Exception('Kode transaksi tidak dapat disetujui karena tidak ditemukan atau telah kedaluwarsa.');
            }

            $sequence->update([
                'status' => 'available',
                'user_id' => null,
                'updated_at' => now(),
            ]);
        });
    }
}
