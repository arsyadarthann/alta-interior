<?php

namespace App\Providers;

use App\Interface\PermissionInterface;
use App\Interface\RoleInterface;
use App\Interface\SupplierInterface;
use App\Interface\UserInterface;
use App\Repositories\PermissionRepository;
use App\Repositories\RoleRepository;
use App\Repositories\SupplierRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PermissionInterface::class, PermissionRepository::class);
        $this->app->bind(RoleInterface::class, RoleRepository::class);
        $this->app->bind(UserInterface::class, UserRepository::class);
        $this->app->bind(SupplierInterface::class, SupplierRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
