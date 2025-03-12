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
        Schema::create('stock_adjustment_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_adjustment_id')->constrained('stock_adjustments');
            $table->foreignId('item_id')->constrained('items');
            $table->enum('type', ['increased', 'decreased', 'balanced']);
            $table->decimal('before_adjustment_quantity', 15, 2);
            $table->decimal('adjustment_quantity', 15, 2);
            $table->decimal('after_adjustment_quantity', 15, 2);
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustment_details');
    }
};
