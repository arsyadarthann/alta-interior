<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sequence_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_sequence_id')->constrained('transaction_sequences');
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->integer('sequence_number');
            $table->enum('status', ['available', 'reserved', 'confirmed']);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sequence_statuses');
    }
};
