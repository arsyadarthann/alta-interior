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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->date('date');
            $table->unsignedSmallInteger('branch_id');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->date('expected_delivery_date');
            $table->enum('status', ['pending', 'partially_received', 'received']);
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
