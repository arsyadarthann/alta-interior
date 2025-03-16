<?php

namespace App\Http\Controllers\Stock;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StockAdjustmentRequest;
use App\Interface\BranchInterface;
use App\Interface\StockAdjustmentInterface;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function __construct(private StockAdjustmentInterface $stockAdjustment, private BranchInterface $branch, private WarehouseInterface $warehouse) {}

    public function index(Request $request)
    {
        $sourceAbleId = $request->query('source_able_id');
        $sourceAbleType = $request->query('source_able_type');

        if ($sourceAbleType === 'Branch') {
            $stockAdjustments = $this->stockAdjustment->getAllByBranch($sourceAbleId);
        } elseif ($sourceAbleType === 'Warehouse') {
            $stockAdjustments = $this->stockAdjustment->getAllByWarehouse($sourceAbleId);
        } else {
            $stockAdjustments = $this->stockAdjustment->getAll();
        }

        return Inertia::render('stock/adjustment/index', [
            'stockAdjustments' => $stockAdjustments,
            'branches' => $this->branch->getAll(),
            'warehouses' => $this->warehouse->getAll(),
            'selectedSourceAbleId' => $sourceAbleId,
            'selectedSourceAbleType' => $sourceAbleType,
        ]);
    }

    public function create()
    {
        return Inertia::render('stock/adjustment/create', [
            'branches' => $this->branch->getAll(),
            'warehouses' => $this->warehouse->getAll(),
        ]);
    }

    public function store(StockAdjustmentRequest $request)
    {
        try {
            $this->stockAdjustment->store($request->validated());
            return redirect()
                ->route('stock.adjustment.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Stock Adjustment Created',
                        'description' => 'Stock adjustment has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the stock adjustment. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Stock Adjustment',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $stockAdjustment = $this->stockAdjustment->getById($id);

        if (!$stockAdjustment) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Stock Adjustment Not Found',
                'customDescription' => 'The stock adjustment you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Stock',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Adjustment',
                        'href' => route('stock.adjustment.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('stock.adjustment.show', $id)
                    ],
                    [
                        'title' => 'Stock Adjustment Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('stock/adjustment/show', [
            'stockAdjustment' => $stockAdjustment,
        ]);
    }

    public function getCode(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $transactionCode = TransactionCode::generateTransactionCode('Stock Adjustment');
            return response()->json(['code' => $transactionCode]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
