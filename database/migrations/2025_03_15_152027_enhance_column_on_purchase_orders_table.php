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
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->decimal('total_amount', 15, 2);
            $table->unsignedSmallInteger('tax_rate_id')->nullable();
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('grand_total', 15, 2);

            $table->foreign('tax_rate_id')->references('id')->on('tax_rates')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign('purchase_orders_tax_rate_id_foreign');
            $table->dropColumn('total_amount');
            $table->dropColumn('tax_rate_id');
            $table->dropColumn('tax_amount');
            $table->dropColumn('grand_total');
        });
    }
};
