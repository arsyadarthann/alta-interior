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
        Schema::create('item_batches', function (Blueprint $table) {
            $table->id();
            $table->string('sku');
            $table->unsignedBigInteger('source_able_id');
            $table->string('source_able_type');
            $table->foreignId('item_id')->constrained('items');
            $table->timestamp('received_at');
            $table->decimal('cogs', 15, 2);
            $table->decimal('stock', 15, 2);
            $table->timestamps();

            $table->index(['source_able_id', 'source_able_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_batches');
    }
};
