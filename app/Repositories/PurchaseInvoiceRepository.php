<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\PurchaseInvoiceInterface;
use App\Models\GoodsReceipt;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseInvoiceDetail;
use App\Models\PurchaseInvoiceGoodsReceipt;
use Illuminate\Support\Facades\DB;

class PurchaseInvoiceRepository implements PurchaseInvoiceInterface
{
    const GENERAL_RELATIONSHIPS = [
        'supplier:id,name'
    ];

    public function __construct(private PurchaseInvoice $purchaseInvoice, private PurchaseInvoiceGoodsReceipt $purchaseInvoiceGoodsReceipt, private PurchaseInvoiceDetail $purchaseInvoiceDetail, private GoodsReceipt $goodsReceipt) {}

    public function getAll()
    {
        return $this->purchaseInvoice->with(self::GENERAL_RELATIONSHIPS)
            ->orderByRaw("id ASC,
                CASE
                    WHEN status = 'unpaid' THEN 1
                    WHEN status = 'partially_paid' THEN 2
                    WHEN status = 'paid' THEN 3
                    ELSE 4
                END
            ")
            ->paginate(10);
    }

    public function getById(int $id)
    {
        return $this->purchaseInvoice->with([
            ...self::GENERAL_RELATIONSHIPS,
            'purchaseInvoicePayments.user',
            'purchaseInvoicePayments.paymentMethod',
            'goodsReceipts.goodsReceiptDetails.purchaseOrderDetail.item.itemUnit',
            'goodsReceipts.goodsReceiptDetails.purchaseOrderDetail.item.itemWholesaleUnit',
            'goodsReceipts.goodsReceiptDetails.purchaseOrderDetail.purchaseOrder:id,code',
        ])->find($id);
    }

    public function getNotPaid(int $supplierId)
    {
        return $this->purchaseInvoice->with(self::GENERAL_RELATIONSHIPS)
            ->where('supplier_id', $supplierId)
            ->where('status', '!=','paid')
            ->get();
    }

    public function getNotInvoicedGoodsReceipts(int $supplierId)
    {
        return $this->goodsReceipt
            ->where('supplier_id', $supplierId)
            ->where('status', '!=', 'invoiced')
            ->get();
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $purchaseInvoice = $this->purchaseInvoice->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'due_date' => $data['due_date'],
                'supplier_id' => $data['supplier_id'],
                'total_amount' => $data['total_amount'] - $data['miscellaneous_cost'] - $data['tax_amount'],
                'miscellaneous_cost' => $data['miscellaneous_cost'],
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
                'remaining_amount' => $data['grand_total'],
            ]);

            foreach ($data['purchase_invoice_goods_receipt'] as $purchaseInvoiceGoodsReceipt) {
                $purchaseInvoice->goodsReceipts()->attach($purchaseInvoiceGoodsReceipt['goods_receipt_id']);

                $pivotId =  $this->purchaseInvoiceGoodsReceipt
                    ->where('purchase_invoice_id', $purchaseInvoice->id)
                    ->where('goods_receipt_id', $purchaseInvoiceGoodsReceipt['goods_receipt_id'])
                    ->value('id');

                $goodsReceipt = $this->goodsReceipt->find($purchaseInvoiceGoodsReceipt['goods_receipt_id']);
                $goodsReceiptDetails = $goodsReceipt->goodsReceiptDetails()->get();
                $goodsReceiptDetailMap = $goodsReceiptDetails->keyBy('id');
                foreach ($purchaseInvoiceGoodsReceipt['purchase_invoice_details'] as $purchaseInvoiceDetail) {
                    $goodsReceiptDetail = $goodsReceiptDetailMap->get($purchaseInvoiceDetail['goods_receipt_detail_id']);

                    $this->purchaseInvoiceDetail->create([
                        'purchase_invoice_goods_receipt_id' => $pivotId,
                        'goods_receipt_detail_id' => $goodsReceiptDetail->id,
                        'quantity' => $goodsReceiptDetail->received_quantity,
                        'unit_price' => $goodsReceiptDetail->price_per_unit,
                        'total_price' => $goodsReceiptDetail->total_price,
                        'miscellaneous_cost' => $goodsReceiptDetail->miscellaneous_cost,
                        'tax_amount' => $goodsReceiptDetail->tax_amount,
                        'grand_total' => $goodsReceiptDetail->total_amount,
                    ]);
                }

                $goodsReceipt->update([
                    'status' => 'invoiced'
                ]);
            }
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $purchaseInvoice = $this->getById($id);

            $purchaseInvoice->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'due_date' => $data['due_date'],
                'supplier_id' => $data['supplier_id'],
                'total_amount' => $data['total_amount'],
                'miscellaneous_cost' => $data['miscellaneous_cost'],
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
                'remaining_amount' => $data['grand_total'],
            ]);

            $currentGoodsReceiptIds = $purchaseInvoice->goodsReceipts()->pluck('goods_receipt_id')->toArray();
            $newGoodsReceiptIds = collect($data['purchase_invoice_goods_receipt'])->pluck('goods_receipt_id')->toArray();
            $detachGoodsReceiptIds = array_diff($currentGoodsReceiptIds, $newGoodsReceiptIds);

            if (!empty($detachGoodsReceiptIds)) {
                $pivotIdsToDelete = $this->purchaseInvoiceGoodsReceipt
                    ->where('purchase_invoice_id', $purchaseInvoice->id)
                    ->whereIn('goods_receipt_id', $detachGoodsReceiptIds)
                    ->pluck('id')
                    ->toArray();

                if (!empty($pivotIdsToDelete)) {
                    $this->purchaseInvoiceDetail->whereIn('purchase_invoice_goods_receipt_id', $pivotIdsToDelete)->delete();
                }

                $purchaseInvoice->goodsReceipts()->detach($detachGoodsReceiptIds);

                $this->goodsReceipt->whereIn('id', $detachGoodsReceiptIds)->update([
                    'status' => 'not_invoiced'
                ]);
            }

            foreach ($data['purchase_invoice_goods_receipt'] as $purchaseInvoiceGoodsReceipt) {
                if (!in_array($purchaseInvoiceGoodsReceipt['goods_receipt_id'], $currentGoodsReceiptIds)) {
                    $purchaseInvoice->goodsReceipts()->attach($purchaseInvoiceGoodsReceipt['goods_receipt_id']);

                    $pivotId =  $this->purchaseInvoiceGoodsReceipt
                        ->where('purchase_invoice_id', $purchaseInvoice->id)
                        ->where('goods_receipt_id', $purchaseInvoiceGoodsReceipt['goods_receipt_id'])
                        ->value('id');

                    $goodsReceipt = $this->goodsReceipt->find($purchaseInvoiceGoodsReceipt['goods_receipt_id']);
                    $goodsReceiptDetails = $goodsReceipt->goodsReceiptDetails()->get();
                    $goodsReceiptDetailMap = $goodsReceiptDetails->keyBy('id');
                    foreach ($purchaseInvoiceGoodsReceipt['purchase_invoice_details'] as $purchaseInvoiceDetail) {
                        $goodsReceiptDetail = $goodsReceiptDetailMap->get($purchaseInvoiceDetail['goods_receipt_detail_id']);

                        $this->purchaseInvoiceDetail->create([
                            'purchase_invoice_goods_receipt_id' => $pivotId,
                            'goods_receipt_detail_id' => $goodsReceiptDetail->id,
                            'quantity' => $goodsReceiptDetail->received_quantity,
                            'unit_price' => $goodsReceiptDetail->price_per_unit,
                            'total_price' => $goodsReceiptDetail->total_price,
                            'miscellaneous_cost' => $goodsReceiptDetail->miscellaneous_cost,
                            'tax_amount' => $goodsReceiptDetail->tax_amount,
                            'grand_total' => $goodsReceiptDetail->total_amount,
                        ]);
                    }

                    $goodsReceipt->update([
                        'status' => 'invoiced'
                    ]);
                }

            }
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $purchaseInvoice = $this->getById($id);
            $goodsReceiptIds = $purchaseInvoice->goodsReceipts()->pluck('goods_receipt_id')->toArray();
            $pivotIds = $this->purchaseInvoiceGoodsReceipt
                ->where('purchase_invoice_id', $purchaseInvoice->id)
                ->pluck('id')
                ->toArray();
            $this->purchaseInvoiceDetail->whereIn('purchase_invoice_goods_receipt_id', $pivotIds)->delete();
            $purchaseInvoice->goodsReceipts()->detach($goodsReceiptIds);
            $this->goodsReceipt->whereIn('id', $goodsReceiptIds)->update([
                'status' => 'not_invoiced'
            ]);
            $purchaseInvoice->delete();
        });
    }
}
