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
        Schema::create('goods_receipt_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_purchase_order_id')->constrained('goods_receipt_purchase_order')->onDelete('cascade');
            $table->foreignId('purchase_order_detail_id')->constrained('purchase_order_details');
            $table->decimal('received_quantity', 15, 2);
            $table->decimal('shipping_cost', 15, 2);
            $table->decimal('price_per_unit', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->decimal('cogs', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_details');
    }
};
