<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Permission::truncate();

        $permissions = [
            'read_permission',
            'create_permission',
            'update_permission',
            'delete_permission',
            'read_role',
            'create_role',
            'update_role',
            'delete_role',
            'read_user',
            'create_user',
            'update_user',
            'delete_user',
            'read_supplier',
            'create_supplier',
            'update_supplier',
            'delete_supplier',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }
    }
}
