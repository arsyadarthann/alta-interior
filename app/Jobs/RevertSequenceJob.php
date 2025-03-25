<?php

namespace App\Jobs;

use App\Models\SequenceStatus;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RevertSequenceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sequenceId;
    public $tries = 3; // Coba job maksimal 3 kali jika gagal

    /**
     * Create a new job instance.
     */
    public function __construct($sequenceId)
    {
        $this->sequenceId = $sequenceId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        \Log::info('RevertSequenceJob started for sequence ID: ' . $this->sequenceId);

        $sequence = SequenceStatus::find($this->sequenceId);

        if ($sequence) {
            \Log::info('Found sequence: ' . $sequence->id . ' with current status: ' . $sequence->status);

            $sequence->update([
                'status' => 'available',
                'user_id' => null,
                'expires_at' => null,
            ]);

            \Log::info('Sequence updated successfully');
        } else {
            \Log::warning('Sequence not found with ID: ' . $this->sequenceId);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        \Log::error('RevertSequenceJob failed for sequence ID: ' . $this->sequenceId, [
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
    }
}
