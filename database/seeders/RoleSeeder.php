<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('role_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        Role::truncate();

        $superAdminRole = Role::create(['name' => 'super_admin']);
        $allPermissions = Permission::all();
        $superAdminRole->syncPermissions($allPermissions);
    }
}
