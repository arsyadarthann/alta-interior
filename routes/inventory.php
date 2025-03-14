<?php

use App\Http\Controllers\Inventory\ItemCategoryController;
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\ItemUnitController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::redirect('inventory', '/inventory/item');

    Route::group(['prefix' => 'inventory/category'], function () {
        Route::get('/', [ItemCategoryController::class, 'index'])->middleware('permission:read_item_category')->name('category.index');
        Route::post('/', [ItemCategoryController::class, 'store'])->middleware('permission:create_item_category')->name('category.store');
        Route::put('/{id}', [ItemCategoryController::class, 'update'])->middleware('permission:update_item_category')->name('category.update');
        Route::delete('/{id}', [ItemCategoryController::class, 'destroy'])->middleware('permission:delete_item_category')->name('category.destroy');
    });

    Route::group(['prefix' => 'inventory/unit'], function () {
        Route::get('/', [ItemUnitController::class, 'index'])->middleware('permission:read_item_unit')->name('unit.index');
        Route::post('/', [ItemUnitController::class, 'store'])->middleware('permission:create_item_unit')->name('unit.store');
        Route::put('/{id}', [ItemUnitController::class, 'update'])->middleware('permission:update_item_unit')->name('unit.update');
        Route::delete('/{id}', [ItemUnitController::class, 'destroy'])->middleware('permission:delete_item_unit')->name('unit.destroy');
    });

    Route::group(['prefix' => 'inventory/item'], function () {
        Route::get('/', [ItemController::class, 'index'])->middleware('permission:read_item')->name('item.index');
        Route::post('/', [ItemController::class, 'store'])->middleware('permission:create_item')->name('item.store');
        Route::put('/{id}', [ItemController::class, 'update'])->middleware('permission:update_item')->name('item.update');
        Route::delete('/{id}', [ItemController::class, 'destroy'])->middleware('permission:delete_item')->name('item.destroy');
        Route::get('/{branchId}/getItemByBranch', [ItemController::class, 'getItemByBranch'])->middleware('permission:read_item')->name('item.getItemByBranch');
        Route::get('/getItemStockByBranch', [ItemController::class, 'getItemStockByBranch'])->middleware('permission:read_item')->name('item.getItemStockByBranch');
    });
});
