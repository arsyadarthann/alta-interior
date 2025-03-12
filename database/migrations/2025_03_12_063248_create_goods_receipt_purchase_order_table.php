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
        Schema::create('goods_receipt_purchase_order', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_id')->constrained('goods_receipts');
            $table->foreignId('purchase_order_id')->constrained('purchase_orders');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_purchase_order');
    }
};
