<?php

namespace App\Repositories;

use App\Interface\ReportInterface;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\GoodsReceiptDetail;
use App\Models\SalesInvoice;
use App\Models\SalesInvoicePayment;
use App\Models\SalesOrder;
use App\Models\SalesOrderDetail;
use App\Models\StockAdjustmentDetail;
use App\Models\StockMovement;
use App\Models\StockTransferDetail;
use App\Models\Waybill;
use App\Models\WaybillDetail;
use Carbon\Carbon;

class ReportRepository implements ReportInterface
{
    public function __construct(private SalesOrder $salesOrder, private SalesOrderDetail $salesOrderDetail, private SalesInvoice $salesInvoice, private SalesInvoicePayment $salesInvoicePayment, private Waybill $waybill, private WaybillDetail $waybillDetail, private Expense $expense, private StockMovement $stockMovement) {}

    private function getDateAndSourceAbleFilters(): array
    {
        return [
            'startDate' => Carbon::parse(request()->start_date)->startOfDay(),
            'endDate' => Carbon::parse(request()->end_date)->endOfDay(),
            'source_able_id' => request()->source_able_id ?? null,
            'source_able_type' => request()->source_able_type ?? null,
            'movementType' => request()->type ?? null,
            'itemId' => request()->item_id ?? null,
            'branchId' => request()->branch_id ?? null,
        ];
    }

    private function getRevenue($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();

        $payments = $this->salesInvoicePayment
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->with('salesInvoice')
            ->get();

        $netRevenue = 0;
        $taxAmount = 0;

        foreach ($payments as $payment) {
            $invoice = $payment->salesInvoice;

            if (!$invoice) continue;

            $total = (float) $invoice->grand_total ?? 0;
            $tax = (float) $invoice->tax_amount ?? 0;
            $paid = (float) $payment->amount;

            if ($total <= 0) continue;

            $paidRatio = $paid / $total;

            $netRevenue += $paid - ($tax * $paidRatio);
            $taxAmount += $tax * $paidRatio;
        }

        return [
            'tax_amount' => $taxAmount,
            'net_revenue' => $netRevenue,
        ];
    }


    private function calculateCogs($id)
    {
        $query = $this->waybillDetail->where('waybill_id', $id)->get();

        if ($query->isNotEmpty()) {
            $stockMovements = $query->map(function ($item) {
                return $item->getStockMovements()->load('itemBatch');
            })->flatten(1);

            return $stockMovements->reduce(function ($carry, $stockMovement) {
                $movementQty = (float) $stockMovement->movement_quantity;
                $cogs = $stockMovement->itemBatch ? (float) $stockMovement->itemBatch->cogs : 0;
                return $carry + ($movementQty * $cogs);
            });
        }

        return 0;
    }

    private function getCogs($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();
        $waybills = $this->waybill
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->get();
        $cogs = 0;

        foreach ($waybills as $waybill) {
            $cogs += $this->calculateCogs($waybill->id);
        }

        return $cogs;
    }

    private function getAverageSalesOrder($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();
        return $this->salesOrder
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->avg('grand_total');
    }

    private function getPendingOrders($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();
        return $this->salesOrder
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->where('status', 'pending')
            ->count();
    }

    private function getCompletedOrders($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();
        return $this->salesOrder
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->where('status', 'completed')
            ->count();
    }

    private function revenueTrend($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();

        $year = date('Y', strtotime($filters['startDate']));

        $revenueData = $this->salesInvoicePayment
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereYear('date', $year)
            ->selectRaw('EXTRACT(MONTH FROM date) as month, SUM(amount) as total_revenue')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => (int) $item->month,
                    'total_revenue' => $item->total_revenue,
                ];
            })
            ->keyBy('month')
            ->all();

        $allMonths = [];
        for ($i = 1; $i <= 12; $i++) {
            $allMonths[$i] = [
                'month' => $i,
                'total_revenue' => 0,
            ];
        }

        $result = array_replace($allMonths, $revenueData);

        ksort($result);

        return $result;
    }

    private function profitOrLossTrend($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();
        $year = date('Y', strtotime($filters['startDate']));

        // 1. Get monthly revenue data
        $revenueData = $this->salesInvoicePayment
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereYear('date', $year)
            ->selectRaw('EXTRACT(MONTH FROM date) as month, SUM(amount) as total_revenue, SUM(amount) / COUNT(DISTINCT sales_invoice_id) as avg_invoice_amount')
            ->groupBy('month')
            ->get();

        // 2. Calculate COGS and tax by month
        $monthlyCogs = [];
        $monthlyTax = [];
        $monthlyExpenses = [];

        // Process revenue data to calculate tax portion
        foreach ($revenueData as $data) {
            $month = (int)$data->month;
            $monthStart = Carbon::create($year, $month, 1)->startOfMonth();
            $monthEnd = Carbon::create($year, $month, 1)->endOfMonth();

            // Get invoices paid in this month
            $paymentsInMonth = $this->salesInvoicePayment
                ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->with('salesInvoice')
                ->get();

            $monthlyTax[$month] = 0;
            foreach ($paymentsInMonth as $payment) {
                if (!$payment->salesInvoice) continue;

                $invoice = $payment->salesInvoice;
                $total = (float)$invoice->grand_total ?? 0;
                $tax = (float)$invoice->tax_amount ?? 0;
                $paid = (float)$payment->amount;

                if ($total <= 0) continue;

                $paidRatio = $paid / $total;
                $monthlyTax[$month] += $tax * $paidRatio;
            }

            // Get waybills created in this month for COGS
            $waybillsInMonth = $this->waybill
                ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->get();

            // Calculate COGS for each waybill
            $monthlyCogs[$month] = 0;
            foreach ($waybillsInMonth as $waybill) {
                $monthlyCogs[$month] += $this->calculateCogs($waybill->id);
            }

            // Calculate expenses for this month
            $monthlyExpenses[$month] = $this->expense
                ->when($branchId, fn($query) => $query->where('source_able_type', Branch::class)
                    ->where('source_able_id', $branchId))
                ->where('is_locked', true)
                ->whereMonth('date', $month)
                ->whereYear('date', $year)
                ->sum('total_amount');
        }

        $allMonths = [];
        for ($i = 1; $i <= 12; $i++) {
            $revenue = $revenueData->where('month', $i)->first() ? (float)$revenueData->where('month', $i)->first()->total_revenue : 0;
            $tax = $monthlyTax[$i] ?? 0;
            $cogs = $monthlyCogs[$i] ?? 0;
            $expenses = $monthlyExpenses[$i] ?? 0;

            $netRevenue = $revenue - $tax;

            $profitOrLoss = $netRevenue - $cogs - $expenses;

            $allMonths[$i] = [
                'month' => $i,
                'total_revenue' => round($revenue, 2),
                'tax_amount' => round($tax, 2),
                'net_revenue' => round($netRevenue, 2),
                'cogs' => round($cogs, 2),
                'expenses' => round($expenses, 2),
                'profit_or_loss' => round($profitOrLoss, 2),
                'profit_margin' => $revenue > 0 ? round(($profitOrLoss / $revenue) * 100, 2) : 0,
            ];
        }

        ksort($allMonths);

        return $allMonths;
    }

    public function getCountSalesOrderStatus($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();

        $statusData = $this->salesOrder
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();

        $allStatuses = [
            'pending' => ['status' => 'pending', 'count' => 0],
            'processed' => ['status' => 'processed', 'count' => 0],
            'completed' => ['status' => 'completed', 'count' => 0],
            'cancelled' => ['status' => 'cancelled', 'count' => 0],
        ];

        foreach ($statusData as $status => $data) {
            $allStatuses[$status]['count'] = $data['count'];
        }

        return collect(array_values($allStatuses));
    }

    private function getExpenses($branchId = null)
    {
        $filters = $this->getDateAndSourceAbleFilters();
        return $this->expense
            ->when($branchId, fn($query) => $query->where('source_able_type', Branch::class)
                ->where('source_able_id', $branchId))
            ->where('is_locked', true)
            ->whereBetween('date', [$filters['startDate'], $filters['endDate']])
            ->sum('total_amount');
    }

    public function getDashboard(): array
    {
        $filters = $this->getDateAndSourceAbleFilters();
        $revenueAndTax = $this->getRevenue($filters['branchId']);
        return [
            'total_revenue' => round($revenueAndTax['net_revenue'], 2) + round($revenueAndTax['tax_amount'], 2),
            'tax_amount' => round($revenueAndTax['tax_amount'], 2),
            'average_sales_order' => round($this->getAverageSalesOrder($filters['branchId']), 2),
            'pending_orders' => $this->getPendingOrders($filters['branchId']),
            'completed_orders' => $this->getCompletedOrders($filters['branchId']),
            'revenue_trend' => $this->revenueTrend($filters['branchId']),
            'sales_order' => [
                'total' => $this->salesOrder->whereBetween('date', [$filters['startDate'], $filters['endDate']])->count(),
                'status' => $this->getCountSalesOrderStatus($filters['branchId']),
            ]
        ];
    }

    public function getProfitLoss(): array
    {
        $filters = $this->getDateAndSourceAbleFilters();
        $revenueAndTax = $this->getRevenue($filters['branchId']);

        $totalRevenue = round($revenueAndTax['net_revenue'], 2);
        $taxAmount = round($revenueAndTax['tax_amount'], 2);
        $cogs = $this->getCogs($filters['branchId']);
        $expenses = $this->getExpenses($filters['branchId']);
        $profitOrLoss = $totalRevenue - $expenses - $cogs;
        $profitOrLossPercentage = $profitOrLoss > 0 ? $profitOrLoss / $totalRevenue * 100 : 0;
        return [
            'total_revenue' => $totalRevenue + $taxAmount,
            'tax_amount' => $taxAmount,
            'total_collected' => $totalRevenue + $taxAmount,
            'cogs' => round($cogs, 2),
            'expenses' => round($expenses, 2),
            'profit_or_loss' => round($profitOrLoss),
            'profit_or_loss_percentage' => round($profitOrLossPercentage),
            'profit_or_loss_trend' => $this->profitOrLossTrend($filters['branchId']),
        ];
    }

    private function formatStockMovements($stockMovements): array
    {
        $data = [
            'source_able_name' => $stockMovements->source_able->name,
            'item_name' => $stockMovements->itemBatch->item->name,
            'item_from' => null,
            'item_unit' => $stockMovements->itemBatch->item->itemUnit->abbreviation,
            'type' => $stockMovements->type,
            'previous_quantity' => $stockMovements->previous_quantity,
            'movement_quantity' => $stockMovements->movement_quantity,
            'after_quantity' => $stockMovements->after_quantity,
            'reference_code' => null,
            'reference_type' => null,
            'reference_by' => null,
            'created_at_date' => $stockMovements->created_at->format('Y-m-d'),
            'created_at_time' => $stockMovements->created_at->format('H:i:s'),
        ];

        switch ($stockMovements->reference_able_type) {
            case GoodsReceiptDetail::class:
                $goodsReceipt = $stockMovements->referenceable->goodsReceiptPurchaseOrder->goodsReceipt;
                $data['item_from'] = 'Warehouse';
                $data['reference_code'] = $goodsReceipt->code;
                $data['reference_type'] = 'Goods Receipt';
                $data['reference_by'] = $goodsReceipt->supplier->name;
                break;
            case StockAdjustmentDetail::class:
                $stockAdjustment = $stockMovements->referenceable->stockAdjustment;
                $data['item_from'] = $stockAdjustment->source_able->name;
                $data['reference_code'] = $stockAdjustment->code;
                $data['reference_type'] = 'Stock Adjustment';
                $data['reference_by'] = $stockAdjustment->user->name;
                break;
            Case StockTransferDetail::class:
                $stockTransfer = $stockMovements->referenceable->stockTransfer;
                $data['item_from'] = $stockTransfer->source_able->name;
                $data['reference_code'] = $stockTransfer->code;
                $data['reference_type'] = 'Stock Transfer';
                $data['reference_by'] = $stockTransfer->user->name;
                break;
            case WaybillDetail::class:
                $waybill = $stockMovements->referenceable->waybill;
                $data['item_from'] = $stockMovements->referenceable->salesOrderDetail->item_source_able->name;
                $data['reference_code'] = $waybill->code;
                $data['reference_type'] = 'Waybill';
                $data['reference_by'] = $waybill->user->name;
                break;
        }

        return $data;
    }

    public function getStockMovements(): array
    {
        $filters = $this->getDateAndSourceAbleFilters();

        $stockMovements = $this->stockMovement
            ->whereBetween('created_at', [$filters['startDate'], $filters['endDate']])
            ->when(isset($filters['itemId']), function ($query) use ($filters) {
                $query->whereHas('itemBatch', function ($query) use ($filters) {
                    $query->where('item_id', $filters['itemId']);
                });
            })
            ->when(isset($filters['movementType']), function ($query) use ($filters) {
                $query->where('type', $filters['movementType']);
            })
            ->when(isset($filters['source_able_id']), function ($query) use ($filters) {
                $query->where('source_able_id', $filters['source_able_id'])
                    ->where('source_able_type', $filters['source_able_type']);
            })
            ->with(['source_able', 'itemBatch.item.itemUnit'])
            ->orderByDesc('id')
            ->get();

        $stockMovements->load([
            'referenceable' => function ($query) {
                $query->when(
                    $query->getModel() instanceof GoodsReceiptDetail,
                    fn($q) => $q->with('goodsReceiptPurchaseOrder.goodsReceipt.supplier')
                );
                $query->when(
                    $query->getModel() instanceof StockAdjustmentDetail,
                    fn($q) => $q->with('stockAdjustment.user', 'stockAdjustment.source_able')
                );
                $query->when(
                    $query->getModel() instanceof StockTransferDetail,
                    fn($q) => $q->with('stockTransfer.user')
                );
                $query->when(
                    $query->getModel() instanceof WaybillDetail,
                    fn($q) => $q->with('waybill.user', 'salesOrderDetail.item.itemUnit', 'salesOrderDetail.item_source_able')
                );
            }
        ]);

        $formattedStockMovements = $stockMovements->map(function ($stockMovement) {
            return $this->formatStockMovements($stockMovement);
        });

        return $formattedStockMovements->toArray();
    }
}
