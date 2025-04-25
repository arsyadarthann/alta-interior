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
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 100)->unique();
            $table->foreignId('item_category_id')->constrained('item_categories');
            $table->foreignId('item_wholesale_unit_id')->nullable()->constrained('item_wholesale_units');
            $table->foreignId('item_unit_id')->constrained('item_units');
            $table->decimal('wholesale_unit_conversion', 15, 2)->nullable();
            $table->decimal('price', 15, 2);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
