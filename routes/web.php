<?php

use App\Http\Controllers\Master\SupplierController;
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
        Route::group(['prefix' => 'suppliers'], function () {
            Route::get('/', [SupplierController::class, 'index'])->middleware('permission:read_supplier')->name('suppliers.index');
            Route::get('/create', [SupplierController::class, 'create'])->middleware('permission:create_supplier')->name('suppliers.create');
            Route::post('/', [SupplierController::class, 'store'])->middleware('permission:create_supplier')->name('suppliers.store');
            Route::put('/{id}', [SupplierController::class, 'update'])->middleware('permission:update_supplier')->name('suppliers.update');
            Route::delete('/{id}', [SupplierController::class, 'destroy'])->middleware('permission:delete_supplier')->name('suppliers.destroy');
        });
    });

    Route::fallback(function () {
        return Inertia::render('errors/error-page', [
            'status' => 404
        ]);
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
