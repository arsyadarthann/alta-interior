<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Interface\BranchInterface;
use App\Interface\ItemInterface;
use App\Interface\ReportInterface;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(private ReportInterface $report, private WarehouseInterface $warehouse, private BranchInterface $branch, private ItemInterface $item) {}

    public function dashboard()
    {
        return Inertia::render('reports/dashboard', [
            'salesData' => $this->report->getDashboard(),
            'branches' => $this->branch->getAll(),
        ]);
    }

    public function getProfitLoss()
    {
        return Inertia::render('reports/profit-loss', [
            'salesReports' => $this->report->getProfitLoss(),
            'branches' => $this->branch->getAll(),
        ]);
    }

    public function getStockMovements()
    {
        return Inertia::render('reports/stock-movements', [
            'warehouses' => $this->warehouse->getAll(),
            'branches' => $this->branch->getAll(),
            'items' => $this->item->getAll(),
            'stockMovements' => $this->report->getStockMovements(),
        ]);
    }
}
