<?php

use App\Http\Controllers\Master\CustomerController;
use App\Http\Controllers\Master\SupplierController;
use App\Http\Controllers\Stock\StockAuditController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('auth/login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::group(['prefix' => 'master'], function () {
        Route::group(['prefix' => 'customers'], function () {
            Route::get('/', [CustomerController::class, 'index'])->middleware('permission:read_customer')->name('customers.index');
            Route::get('/create', [CustomerController::class, 'create'])->middleware('permission:create_customer')->name('customers.create');
            Route::post('/', [CustomerController::class, 'store'])->middleware('permission:create_customer')->name('customers.store');
            Route::get('/{id}', [CustomerController::class, 'show'])->middleware('permission:read_customer')->name('customers.show');
            Route::get('/{id}/edit', [CustomerController::class, 'edit'])->middleware('permission:update_customer')->name('customers.edit');
            Route::put('/{id}', [CustomerController::class, 'update'])->middleware('permission:update_customer')->name('customers.update');
            Route::delete('/{id}', [CustomerController::class, 'destroy'])->middleware('permission:delete_customer')->name('customers.destroy');
        });

        Route::group(['prefix' => 'suppliers'], function () {
            Route::get('/', [SupplierController::class, 'index'])->middleware('permission:read_supplier')->name('suppliers.index');
            Route::get('/create', [SupplierController::class, 'create'])->middleware('permission:create_supplier')->name('suppliers.create');
            Route::post('/', [SupplierController::class, 'store'])->middleware('permission:create_supplier')->name('suppliers.store');
            Route::put('/{id}', [SupplierController::class, 'update'])->middleware('permission:update_supplier')->name('suppliers.update');
            Route::delete('/{id}', [SupplierController::class, 'destroy'])->middleware('permission:delete_supplier')->name('suppliers.destroy');
        });
    });

    Route::group(['prefix' => 'stock'], function () {
        Route::group(['prefix' => 'audit'], function () {
            Route::get('/', [StockAuditController::class, 'index'])->middleware('permission:read_stock_audit')->name('stock.audit.index');
            Route::get('/create', [StockAuditController::class, 'create'])->middleware('permission:create_stock_audit')->name('stock.audit.create');
            Route::post('/', [StockAuditController::class, 'store'])->middleware('permission:create_stock_audit')->name('stock.audit.store');
            Route::get('/getCode', [StockAuditController::class, 'getCode'])->middleware('permission:read_stock_audit')->name('stock.audit.getCode');
            Route::get('/{id}', [StockAuditController::class, 'show'])->middleware('permission:read_stock_audit')->name('stock.audit.show');
            Route::get('/{id}/edit', [StockAuditController::class, 'edit'])->middleware('permission:update_stock_audit')->name('stock.audit.edit');
            Route::put('/{id}', [StockAuditController::class, 'update'])->middleware('permission:update_stock_audit')->name('stock.audit.update');
            Route::delete('/{id}', [StockAuditController::class, 'destroy'])->middleware('permission:delete_stock_audit')->name('stock.audit.destroy');
            Route::patch('/{id}/lock', [StockAuditController::class, 'lock'])->middleware('permission:update_stock_audit')->name('stock.audit.lock');
        });

        Route::group(['prefix' => 'adjustment'], function () {

        });

        Route::group(['prefix' => 'transfer'], function () {});
    });

    Route::fallback(function () {
        return Inertia::render('errors/error-page', [
            'status' => 404
        ]);
    });
});

require __DIR__.'/inventory.php';
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
