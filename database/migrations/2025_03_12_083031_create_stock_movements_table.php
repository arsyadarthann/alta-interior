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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('branch_id');
            $table->foreignId('item_id')->constrained('items');
            $table->enum('type', ['in', 'out', 'increased', 'decreased', 'balanced']);
            $table->decimal('previous_quantity', 15, 2);
            $table->decimal('movement_quantity', 15, 2);
            $table->decimal('after_quantity', 15, 2);
            $table->bigInteger('reference_able_id');
            $table->string('reference_able_type');
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
