<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\PurchaseInvoicePaymentInterface;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoicePayment;
use Illuminate\Support\Facades\DB;

class PurchaseInvoicePaymentRepository implements PurchaseInvoicePaymentInterface
{
    const GENERAL_RELATIONSHIPS = [
        'user:id,name', 'paymentMethod:id,name'
    ];

    public function __construct(private PurchaseInvoicePayment $purchaseInvoicePayment, private PurchaseInvoice $purchaseInvoice) {}

    public function getAll()
    {
        return $this->purchaseInvoicePayment
            ->with([...self::GENERAL_RELATIONSHIPS, 'purchaseInvoice:id,code'])
            ->orderByDesc('date')
            ->paginate(10);
    }

    public function getById(int $id)
    {
        return $this->purchaseInvoicePayment->with([
            ...self::GENERAL_RELATIONSHIPS,
            'purchaseInvoice.goodsReceipts.goodsReceiptDetails.purchaseOrderDetail.item.itemUnit',
            'purchaseInvoice.goodsReceipts.goodsReceiptDetails.purchaseOrderDetail.purchaseOrder:id,code'
        ])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->purchaseInvoicePayment->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'user_id' => request()->user()->id,
                'purchase_invoice_id' => $data['purchase_invoice_id'],
                'payment_method_id' => $data['payment_method_id'],
                'amount' => $data['amount']
            ]);

            $purchaseInvoice = $this->purchaseInvoice->find($data['purchase_invoice_id']);
            $remainingAmount = $purchaseInvoice->remaining_amount - $data['amount'];
            $status = 'partially_paid';
            if ($remainingAmount <= 0) {
                $status = 'paid';
            }
            $purchaseInvoice->update([
                'remaining_amount' => $remainingAmount,
                'status' => $status
            ]);

            TransactionCode::confirmTransactionCode('Purchase Invoice Payment', $data['code']);
        });
    }
}
