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
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->date('date');
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedSmallInteger('branch_id');
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->string('customer_name', 100)->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->unsignedSmallInteger('tax_rate_id')->nullable();
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('grand_total', 15, 2);
            $table->enum('status', ['pending', 'processed', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();

            $table->foreign('branch_id')->references('id')->on('branches');
            $table->foreign('tax_rate_id')->references('id')->on('tax_rates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};
