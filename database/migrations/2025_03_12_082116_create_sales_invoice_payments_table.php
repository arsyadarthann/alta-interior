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
        Schema::create('sales_invoice_payments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->date('date');
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedSmallInteger('branch_id');
            $table->foreignId('sales_invoice_id')->constrained('sales_invoices');
            $table->unsignedSmallInteger('payment_method_id');
            $table->decimal('amount', 15, 2);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_invoice_payments');
    }
};
