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
            'read_branch',
            'create_branch',
            'update_branch',
            'delete_branch',
            'read_tax_rate',
            'create_tax_rate',
            'update_tax_rate',
            'delete_tax_rate',
            'read_payment_method',
            'create_payment_method',
            'update_payment_method',
            'delete_payment_method',
            'read_transaction_prefix',
            'update_transaction_prefix',
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
