<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\SalesInvoicePaymentInterface;
use App\Models\Branch;
use App\Models\SalesInvoice;
use App\Models\SalesInvoicePayment;
use Illuminate\Support\Facades\DB;

class SalesInvoicePaymentRepository implements SalesInvoicePaymentInterface
{
    const GENERAL_RELATIONSHIPS = [
        'user:id,name', 'branch:id,name', 'salesInvoice', 'paymentMethod'
    ];

    public function __construct(private SalesInvoicePayment $salesInvoicePayment, private SalesInvoice $salesInvoice) {}

    public function getAll($branchId = null)
    {
        return $this->salesInvoicePayment
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->orderByDesc('id')
            ->orderByDesc('date')
            ->paginate(10);
    }

    public function getById(int $id)
    {
        return $this->salesInvoicePayment
            ->with([
                ...self::GENERAL_RELATIONSHIPS,
                'salesInvoice.salesInvoiceDetails.waybill.salesOrder',
                'salesInvoice.salesInvoiceDetails.waybill.waybillDetails.salesOrderDetail.item_source_able',
                'salesInvoice.salesInvoiceDetails.waybill.waybillDetails.salesOrderDetail.item.itemUnit',
            ])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->salesInvoicePayment->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'user_id' => request()->user()->id,
                'branch_id' => request()->user()->branch_id,
                'sales_invoice_id' => $data['sales_invoice_id'],
                'payment_method_id' => $data['payment_method_id'],
                'amount' => $data['amount'],
                'note' => $data['note']
            ]);

            $salesInvoice = $this->salesInvoice->find($data['sales_invoice_id']);

            $remainingAmount = $salesInvoice->remaining_amount - $data['amount'];
            $paidAmount = $salesInvoice->paid_amount + $data['amount'];

            $status = 'partially_paid';
            if ($paidAmount >= $salesInvoice->grand_total) {
                $status = 'paid';
            }

            $salesInvoice->update([
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'paid_status' => $status,
            ]);

            TransactionCode::confirmTransactionCode('Sales Invoice Payment', $data['code'], Branch::class, request()->user()->branch_id);
        });
    }
}
