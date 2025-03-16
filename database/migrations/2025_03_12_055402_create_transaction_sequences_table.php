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
        Schema::create('transaction_sequences', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('transaction_prefix_id')->nullable();
            $table->unsignedBigInteger('source_able_id')->nullable();
            $table->string('source_able_type')->nullable();
            $table->smallInteger('month');
            $table->smallInteger('year');
            $table->integer('sequence');
            $table->timestamps();

            $table->foreign('transaction_prefix_id')->references('id')->on('transaction_prefixes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_sequences');
    }
};
