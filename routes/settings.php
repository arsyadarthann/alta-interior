<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PermissionController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RoleController;
use App\Http\Controllers\Settings\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
});
