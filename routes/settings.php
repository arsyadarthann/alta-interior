<?php

use App\Http\Controllers\Settings\BranchController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PaymentMethodController;
use App\Http\Controllers\Settings\PermissionController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RoleController;
use App\Http\Controllers\Settings\TaxRateController;
use App\Http\Controllers\Settings\TransactionPrefixController;
use App\Http\Controllers\Settings\UserController;
use App\Http\Controllers\Settings\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::group(['prefix' => 'settings/permissions'], function () {
        Route::get('/', [PermissionController::class, 'index'])->middleware('permission:read_permission')->name('permissions.index');
        Route::post('/', [PermissionController::class, 'store'])->middleware('permission:create_permission')->name('permissions.store');
        Route::get('/{id}/edit', [PermissionController::class, 'edit'])->middleware('permission:update_permission')->name('permissions.edit');
        Route::put('/{id}', [PermissionController::class, 'update'])->middleware('permission:update_permission')->name('permissions.update');
        Route::delete('/{id}', [PermissionController::class, 'destroy'])->middleware('permission:delete_permission')->name('permissions.destroy');
    });

    Route::group(['prefix' => 'settings/roles'], function () {
        Route::get('/', [RoleController::class, 'index'])->middleware('permission:read_role')->name('roles.index');
        Route::get('/create', [RoleController::class, 'create'])->middleware('permission:create_role')->name('roles.create');
        Route::post('/', [RoleController::class, 'store'])->middleware('permission:create_role')->name('roles.store');
        Route::get('/{id}/edit', [RoleController::class, 'edit'])->middleware('permission:update_role')->name('roles.edit');
        Route::put('/{id}', [RoleController::class, 'update'])->middleware('permission:update_role')->name('roles.update');
        Route::delete('/{id}', [RoleController::class, 'destroy'])->middleware('permission:delete_role')->name('roles.destroy');
    });

    Route::group(['prefix' => 'settings/users'], function () {
        Route::get('/', [UserController::class, 'index'])->middleware('permission:read_user')->name('users.index');
        Route::get('/create', [UserController::class, 'create'])->middleware('permission:create_user')->name('users.create');
        Route::post('/', [UserController::class, 'store'])->middleware('permission:create_user')->name('users.store');
        Route::get('/{id}/edit', [UserController::class, 'edit'])->middleware('permission:update_user')->name('users.edit');
        Route::put('/{id}', [UserController::class, 'update'])->middleware('permission:update_user')->name('users.update');
        Route::delete('/{id}', [UserController::class, 'destroy'])->middleware('permission:delete_user')->name('users.destroy');
        Route::patch('/{id}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:update_user')->name('users.reset-password');
    });

    Route::group(['prefix' => 'settings/warehouses'], function () {
        Route::get('/', [WarehouseController::class, 'index'])->middleware('permission:read_warehouse')->name('warehouses.index');
        Route::post('/', [WarehouseController::class, 'store'])->middleware('permission:create_warehouse')->name('warehouses.store');
        Route::put('/{id}', [WarehouseController::class, 'update'])->middleware('permission:update_warehouse')->name('warehouses.update');
        Route::delete('/{id}', [WarehouseController::class, 'destroy'])->middleware('permission:delete_warehouse')->name('warehouses.destroy');
    });

    Route::group(['prefix' => 'settings/branches'], function () {
        Route::get('/', [BranchController::class, 'index'])->middleware('permission:read_branch')->name('branches.index');
        Route::get('/create', [BranchController::class, 'create'])->middleware('permission:create_branch')->name('branches.create');
        Route::post('/', [BranchController::class, 'store'])->middleware('permission:create_branch')->name('branches.store');
        Route::get('/{id}/edit', [BranchController::class, 'edit'])->middleware('permission:update_branch')->name('branches.edit');
        Route::put('/{id}', [BranchController::class, 'update'])->middleware('permission:update_branch')->name('branches.update');
        Route::delete('/{id}', [BranchController::class, 'destroy'])->middleware('permission:delete_branch')->name('branches.destroy');
    });

    Route::group(['prefix' => 'settings/tax-rates'], function () {
        Route::get('/', [TaxRateController::class, 'index'])->middleware('permission:read_tax_rate')->name('tax-rates.index');
        Route::post('/', [TaxRateController::class, 'store'])->middleware('permission:create_tax_rate')->name('tax-rates.store');
        Route::put('/{id}', [TaxRateController::class, 'update'])->middleware('permission:update_tax_rate')->name('tax-rates.update');
        Route::delete('/{id}', [TaxRateController::class, 'destroy'])->middleware('permission:delete_tax_rate')->name('tax-rates.destroy');
    });

    Route::group(['prefix' => 'settings/payment-methods'], function () {
        Route::get('/', [PaymentMethodController::class, 'index'])->middleware('permission:read_payment_method')->name('payment-methods.index');
        Route::post('/', [PaymentMethodController::class, 'store'])->middleware('permission:create_payment_method')->name('payment-methods.store');
        Route::put('/{id}', [PaymentMethodController::class, 'update'])->middleware('permission:update_payment_method')->name('payment-methods.update');
        Route::delete('/{id}', [PaymentMethodController::class, 'destroy'])->middleware('permission:delete_payment_method')->name('payment-methods.destroy');
    });

    Route::group(['prefix' => 'settings/transaction-prefix'], function () {
        Route::get('/', [TransactionPrefixController::class, 'index'])->middleware('permission:read_transaction_prefix')->name('transaction-prefix.index');
        Route::put('/', [TransactionPrefixController::class, 'update'])->middleware('permission:update_transaction_prefix')->name('transaction-prefix.update');
    });
});
