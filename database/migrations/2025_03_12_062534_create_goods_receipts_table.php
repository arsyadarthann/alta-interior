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
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->date('date');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->string('received_by', 100)->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('miscellaneous_cost', 15, 2);
            $table->foreignId('tax_rate_id')->nullable()->constrained('tax_rates');
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('grand_total', 15, 2);
            $table->enum('status', ['not_invoiced', 'invoiced'])->default('not_invoiced');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipts');
    }
};
