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
        Schema::create('waybill_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('waybill_id')->constrained('waybills');
            $table->foreignId('sales_order_detail_id')->constrained('sales_order_details');
            $table->decimal('quantity', 15, 2);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waybill_details');
    }
};
