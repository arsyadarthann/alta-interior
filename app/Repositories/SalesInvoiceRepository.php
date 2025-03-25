<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\SalesInvoiceInterface;
use App\Models\Branch;
use App\Models\SalesInvoice;
use App\Models\Waybill;
use Illuminate\Support\Facades\DB;

class SalesInvoiceRepository implements SalesInvoiceInterface
{
    const GENERAL_RELATIONSHIPS = [
        'user:id,name', 'branch:id,name', 'customer', 'taxRate:id,rate'
    ];

    public function __construct(private SalesInvoice $salesInvoice, private Waybill $waybill) {}

    public function getAll($branchId = null)
    {
        return $this->salesInvoice->with(self::GENERAL_RELATIONSHIPS)
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->orderBy('id', 'desc')
            ->orderBy('code', 'desc')
            ->paginate(10);
    }

    public function getById(int $id)
    {
        return $this->salesInvoice->with([
            ...self::GENERAL_RELATIONSHIPS,
            'salesInvoiceDetails.waybill.salesOrder',
            'salesInvoiceDetails.waybill.waybillDetails.salesOrderDetail.item_source_able',
            'salesInvoiceDetails.waybill.waybillDetails.salesOrderDetail.item.itemUnit',
        ])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $salesInvoice = $this->salesInvoice->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'due_date' => $data['due_date'],
                'user_id' => request()->user()->id,
                'branch_id' => request()->user()->branch_id,
                'customer_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'total_amount' => $data['total_amount'],
                'discount_type' => $data['discount_type'],
                'discount_percentage' => $data['discount_percentage'] ?? null,
                'discount_amount' => $data['discount_amount'],
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
                'remaining_amount' => $data['grand_total'],
            ]);

            foreach ($data['sales_invoice_details'] as $salesInvoiceDetail) {
                $salesInvoice->salesInvoiceDetails()->create([
                    'waybill_id' => $salesInvoiceDetail['waybill_id'],
                ]);

                $this->waybill->find($salesInvoiceDetail['waybill_id'])->update([
                    'status' => 'invoiced',
                ]);
            }

            TransactionCode::confirmTransactionCode('Sales Invoice', $data['code'], Branch::class, request()->user()->branch_id);
        });
    }

    public function getNotPaidSalesInvoiceDetails($branchId)
    {
        return $this->salesInvoice->with(self::GENERAL_RELATIONSHIPS)
            ->where('branch_id', $branchId)
            ->where('paid_status', '!=', 'paid')
            ->get();
    }

    public function update(array $data, int $id)
    {
        return DB::transaction(function () use ($data, $id) {
            $salesInvoice = $this->getById($id);

            $existingWaybills = $salesInvoice->salesInvoiceDetails()->pluck('waybill_id')->toArray();

            $salesInvoice->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'due_date' => $data['due_date'],
                'user_id' => request()->user()->id,
                'branch_id' => request()->user()->branch_id,
                'customer_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'total_amount' => $data['total_amount'],
                'discount_type' => $data['discount_type'],
                'discount_percentage' => $data['discount_percentage'] ?? null,
                'discount_amount' => $data['discount_amount'],
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
                'remaining_amount' => $data['grand_total'],
            ]);

            $submittedWaybillIds = collect($data['sales_invoice_details'])->pluck('waybill_id')->filter()->toArray();
            $waybillToRemoveIds = array_diff($existingWaybills, $submittedWaybillIds);

            if (!empty($waybillToRemoveIds)) {
                $this->waybill->whereIn('id', $waybillToRemoveIds)->update([
                    'status' => 'not_invoiced',
                ]);
            }

            $salesInvoice->salesInvoiceDetails()->whereIn('waybill_id', $waybillToRemoveIds)->delete();

            foreach ($data['sales_invoice_details'] as $salesInvoiceDetail) {
                $waybillId = $salesInvoiceDetail['waybill_id'];

                $existingWaybill = $salesInvoice->salesInvoiceDetails()->where('waybill_id', $waybillId)->first();

                if ($existingWaybill) {
                    continue;
                } else {
                    $salesInvoice->salesInvoiceDetails()->create([
                        'waybill_id' => $waybillId,
                    ]);

                    $this->waybill->find($waybillId)->update([
                        'status' => 'invoiced',
                    ]);
                }
            }
        });
    }

    public function delete(int $id)
    {
        return DB::transaction(function () use ($id) {
            $salesInvoice = $this->getById($id);
            $code = $salesInvoice->code;
            $waybillIds = $salesInvoice->salesInvoiceDetails()->pluck('waybill_id')->toArray();
            $this->waybill->whereIn('id', $waybillIds)->update([
                'status' => 'not_invoiced',
            ]);
            TransactionCode::cancelTransactionCode('Sales Invoice', $code, $salesInvoice->branch_id, Branch::class);
            $salesInvoice->salesInvoiceDetails()->delete();
            $salesInvoice->delete();
        });
    }
}
