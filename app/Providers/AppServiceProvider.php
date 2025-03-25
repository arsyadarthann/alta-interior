<?php

namespace App\Providers;

use App\Interface\BranchInterface;
use App\Interface\CustomerInterface;
use App\Interface\GoodsReceiptInterface;
use App\Interface\ItemCategoryInterface;
use App\Interface\ItemInterface;
use App\Interface\ItemUnitInterface;
use App\Interface\PaymentMethodInterface;
use App\Interface\PermissionInterface;
use App\Interface\PurchaseInvoiceInterface;
use App\Interface\PurchaseInvoicePaymentInterface;
use App\Interface\PurchaseOrderInterface;
use App\Interface\RoleInterface;
use App\Interface\SalesInvoiceInterface;
use App\Interface\SalesInvoicePaymentInterface;
use App\Interface\SalesOrderInterface;
use App\Interface\StockAdjustmentInterface;
use App\Interface\StockAuditInterface;
use App\Interface\StockTransferInterface;
use App\Interface\SupplierInterface;
use App\Interface\TaxRateInterface;
use App\Interface\TransactionPrefixInterface;
use App\Interface\UserInterface;
use App\Interface\WarehouseInterface;
use App\Interface\WaybillInterface;
use App\Repositories\BranchRepository;
use App\Repositories\CustomerRepository;
use App\Repositories\GoodsReceiptRepository;
use App\Repositories\ItemCategoryRepository;
use App\Repositories\ItemRepository;
use App\Repositories\ItemUnitRepository;
use App\Repositories\PaymentMethodRepository;
use App\Repositories\PermissionRepository;
use App\Repositories\PurchaseInvoicePaymentRepository;
use App\Repositories\PurchaseInvoiceRepository;
use App\Repositories\PurchaseOrderRepository;
use App\Repositories\RoleRepository;
use App\Repositories\SalesInvoicePaymentRepository;
use App\Repositories\SalesInvoiceRepository;
use App\Repositories\SalesOrderRepository;
use App\Repositories\StockAdjustmentRepository;
use App\Repositories\StockAuditRepository;
use App\Repositories\StockTransferRepository;
use App\Repositories\SupplierRepository;
use App\Repositories\TaxRateRepository;
use App\Repositories\TransactionPrefixRepository;
use App\Repositories\UserRepository;
use App\Repositories\WarehouseRepository;
use App\Repositories\WaybillRepository;
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
        $this->app->bind(WarehouseInterface::class, WarehouseRepository::class);
        $this->app->bind(BranchInterface::class, BranchRepository::class);
        $this->app->bind(TaxRateInterface::class, TaxRateRepository::class);
        $this->app->bind(PaymentMethodInterface::class, PaymentMethodRepository::class);
        $this->app->bind(TransactionPrefixInterface::class, TransactionPrefixRepository::class);
        $this->app->bind(CustomerInterface::class, CustomerRepository::class);
        $this->app->bind(SupplierInterface::class, SupplierRepository::class);
        $this->app->bind(ItemCategoryInterface::class, ItemCategoryRepository::class);
        $this->app->bind(ItemUnitInterface::class, ItemUnitRepository::class);
        $this->app->bind(ItemInterface::class, ItemRepository::class);
        $this->app->bind(StockAuditInterface::class, StockAuditRepository::class);
        $this->app->bind(StockAdjustmentInterface::class, StockAdjustmentRepository::class);
        $this->app->bind(StockTransferInterface::class, StockTransferRepository::class);
        $this->app->bind(PurchaseOrderInterface::class, PurchaseOrderRepository::class);
        $this->app->bind(GoodsReceiptInterface::class, GoodsReceiptRepository::class);
        $this->app->bind(PurchaseInvoiceInterface::class, PurchaseInvoiceRepository::class);
        $this->app->bind(PurchaseInvoicePaymentInterface::class, PurchaseInvoicePaymentRepository::class);
        $this->app->bind(SalesOrderInterface::class, SalesOrderRepository::class);
        $this->app->bind(WaybillInterface::class, WaybillRepository::class);
        $this->app->bind(SalesInvoiceInterface::class, SalesInvoiceRepository::class);
        $this->app->bind(SalesInvoicePaymentInterface::class, SalesInvoicePaymentRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
