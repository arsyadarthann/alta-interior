<?php

use App\Http\Controllers\Master\CustomerController;
use App\Http\Controllers\Master\SupplierController;
use App\Http\Controllers\Procurement\PurchaseInvoiceController;
use App\Http\Controllers\Procurement\PurchaseInvoicePaymentController;
use App\Http\Controllers\Procurement\PurchaseOrderController;
use App\Http\Controllers\Procurement\GoodsReceiptController;
use App\Http\Controllers\Stock\StockAdjustmentController;
use App\Http\Controllers\Stock\StockAuditController;
use App\Http\Controllers\Stock\StockTransferController;
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
            Route::get('/{id}/edit', [SupplierController::class, 'edit'])->middleware('permission:update_supplier')->name('suppliers.edit');
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
            Route::get('/', [StockAdjustmentController::class, 'index'])->middleware('permission:read_stock_adjustment')->name('stock.adjustment.index');
            Route::get('/create', [StockAdjustmentController::class, 'create'])->middleware('permission:create_stock_adjustment')->name('stock.adjustment.create');
            Route::post('/', [StockAdjustmentController::class, 'store'])->middleware('permission:create_stock_adjustment')->name('stock.adjustment.store');
            Route::get('/getCode', [StockAdjustmentController::class, 'getCode'])->middleware('permission:read_stock_adjustment')->name('stock.adjustment.getCode');
            Route::get('/{id}', [StockAdjustmentController::class, 'show'])->middleware('permission:read_stock_adjustment')->name('stock.adjustment.show');
        });

        Route::group(['prefix' => 'transfer'], function () {
            Route::get('/', [StockTransferController::class, 'index'])->middleware('permission:read_stock_transfer')->name('stock.transfer.index');
            Route::get('/create', [StockTransferController::class, 'create'])->middleware('permission:create_stock_transfer')->name('stock.transfer.create');
            Route::post('/', [StockTransferController::class, 'store'])->middleware('permission:create_stock_transfer')->name('stock.transfer.store');
            Route::get('/getCode', [StockTransferController::class, 'getCode'])->middleware('permission:read_stock_transfer')->name('stock.transfer.getCode');
            Route::get('/{id}', [StockTransferController::class, 'show'])->middleware('permission:read_stock_transfer')->name('stock.transfer.show');
        });
    });

    Route::group(['prefix' => 'procurement'], function () {
        Route::group(['prefix' => 'orders'], function () {
            Route::get('/', [PurchaseOrderController::class, 'index'])->middleware('permission:read_purchase_order')->name('procurement.order.index');
            Route::get('/create', [PurchaseOrderController::class, 'create'])->middleware('permission:create_purchase_order')->name('procurement.order.create');
            Route::post('/', [PurchaseOrderController::class, 'store'])->middleware('permission:create_purchase_order')->name('procurement.order.store');
            Route::get('/getCode', [PurchaseOrderController::class, 'getCode'])->middleware('permission:read_purchase_order')->name('procurement.order.getCode');
            Route::get('/{id}', [PurchaseOrderController::class, 'show'])->middleware('permission:read_purchase_order')->name('procurement.order.show');
            Route::get('/{id}/edit', [PurchaseOrderController::class, 'edit'])->middleware('permission:update_purchase_order')->name('procurement.order.edit');
            Route::put('/{id}', [PurchaseOrderController::class, 'update'])->middleware('permission:update_purchase_order')->name('procurement.order.update');
            Route::delete('/{id}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:delete_purchase_order')->name('procurement.order.destroy');
            Route::get('/{id}/generate-pdf', [PurchaseOrderController::class, 'generatePdf'])->middleware('permission:read_purchase_order')->name('procurement.order.generate-pdf');
        });

        Route::group(['prefix' => 'receipts'], function () {
            Route::get('/', [GoodsReceiptController::class, 'index'])->middleware('permission:read_goods_receipt')->name('procurement.receipt.index');
            Route::get('/create', [GoodsReceiptController::class, 'create'])->middleware('permission:create_goods_receipt')->name('procurement.receipt.create');
            Route::post('/', [GoodsReceiptController::class, 'store'])->middleware('permission:create_goods_receipt')->name('procurement.receipt.store');
            Route::get('/get-unreceived-purchase-order-details', [GoodsReceiptController::class, 'getUnreceivedPurchaseOrderDetails'])->middleware('permission:read_goods_receipt')->name('procurement.receipt.getUnreceivedPurchaseOrderDetails');
            Route::get('/{id}', [GoodsReceiptController::class, 'show'])->middleware('permission:read_goods_receipt')->name('procurement.receipt.show');
        });

        Route::group(['prefix' => 'invoices'], function () {
            Route::get('/', [PurchaseInvoiceController::class, 'index'])->middleware('permission:read_purchase_invoice')->name('procurement.invoice.index');
            Route::get('/create', [PurchaseInvoiceController::class, 'create'])->middleware('permission:create_purchase_invoice')->name('procurement.invoice.create');
            Route::get('/getNotInvoicedGoodsReceipts', [PurchaseInvoiceController::class, 'getNotInvoicedGoodsReceipts'])->middleware('permission:create_purchase_invoice')->name('procurement.invoice.getNotInvoicedGoodsReceipts');
            Route::get('/getGoodsReceiptData', [PurchaseInvoiceController::class, 'getGoodsReceiptData'])->middleware('permission:read_purchase_invoice')->name('procurement.invoice.getGoodsReceiptData');
            Route::post('/', [PurchaseInvoiceController::class, 'store'])->middleware('permission:create_purchase_invoice')->name('procurement.invoice.store');
            Route::get('/{id}/edit', [PurchaseInvoiceController::class, 'edit'])->middleware('permission:update_purchase_invoice')->name('procurement.invoice.edit');
            Route::put('/{id}', [PurchaseInvoiceController::class, 'update'])->middleware('permission:update_purchase_invoice')->name('procurement.invoice.update');
            Route::get('/{id}', [PurchaseInvoiceController::class, 'show'])->middleware('permission:read_purchase_invoice')->name('procurement.invoice.show');
            Route::delete('/{id}', [PurchaseInvoiceController::class, 'destroy'])->middleware('permission:delete_purchase_invoice')->name('procurement.invoice.destroy');
        });

        Route::group(['prefix' => 'payments'], function () {
            Route::get('/', [PurchaseInvoicePaymentController::class, 'index'])->middleware('permission:read_purchase_invoice_payment')->name('procurement.payment.index');
            Route::get('/create', [PurchaseInvoicePaymentController::class, 'create'])->middleware('permission:create_purchase_invoice_payment')->name('procurement.payment.create');
            Route::get('/getCode', [PurchaseInvoicePaymentController::class, 'getCode'])->middleware('permission:read_purchase_invoice_payment')->name('procurement.payment.getCode');
            Route::get('/getNotPaidPurchaseInvoice', [PurchaseInvoicePaymentController::class, 'getNotPaidPurchaseInvoice'])->middleware('permission:read_purchase_invoice_payment')->name('procurement.payment.getNotPaidInvoice');
            Route::get('/getPurchaseInvoiceData', [PurchaseInvoicePaymentController::class, 'getPurchaseInvoiceData'])->middleware('permission:read_purchase_invoice_payment')->name('procurement.payment.getPurchaseInvoiceData');
            Route::post('/', [PurchaseInvoicePaymentController::class, 'store'])->middleware('permission:create_purchase_invoice_payment')->name('procurement.payment.store');
            Route::get('/{id}', [PurchaseInvoicePaymentController::class, 'show'])->middleware('permission:read_purchase_invoice_payment')->name('procurement.payment.show');
        });
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
