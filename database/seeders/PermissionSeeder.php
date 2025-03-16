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
            'read_warehouse',
            'create_warehouse',
            'update_warehouse',
            'delete_warehouse',
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
            'read_customer',
            'create_customer',
            'update_customer',
            'delete_customer',
            'read_supplier',
            'create_supplier',
            'update_supplier',
            'delete_supplier',
            'read_item_category',
            'create_item_category',
            'update_item_category',
            'delete_item_category',
            'read_item_unit',
            'create_item_unit',
            'update_item_unit',
            'delete_item_unit',
            'read_item',
            'create_item',
            'update_item',
            'delete_item',
            'read_stock_audit',
            'create_stock_audit',
            'update_stock_audit',
            'delete_stock_audit',
            'read_stock_adjustment',
            'create_stock_adjustment',
            'read_stock_transfer',
            'create_stock_transfer',
            'read_purchase_order',
            'create_purchase_order',
            'update_purchase_order',
            'delete_purchase_order',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }
    }
}
