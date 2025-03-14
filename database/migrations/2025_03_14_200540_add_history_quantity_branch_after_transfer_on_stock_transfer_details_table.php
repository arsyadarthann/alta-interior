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
        Schema::table('stock_transfer_details', function (Blueprint $table) {
            $table->decimal('from_branch_before_quantity', 15, 2);
            $table->decimal('from_branch_after_quantity', 15, 2);
            $table->decimal('to_branch_before_quantity', 15, 2);
            $table->decimal('to_branch_after_quantity', 15, 2);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_transfer_details', function (Blueprint $table) {
            $table->dropColumn('from_branch_before_quantity');
            $table->dropColumn('to_branch_before_quantity');
            $table->dropColumn('from_branch_after_quantity');
            $table->dropColumn('to_branch_after_quantity');
        });
    }
};
