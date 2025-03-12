<?php

namespace App\Jobs;

use App\Models\SequenceStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RevertSequenceJob implements ShouldQueue
{
    use Queueable;

    public $sequenceId;

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
        $sequence = SequenceStatus::find($this->sequenceId);

        if ($sequence && $sequence->isReserved() && $sequence->expires_at <= now()) {
            $sequence->update([
                'status' => 'available',
                'user_id' => null,
                'expires_at' => null,
            ]);
        }
    }
}
