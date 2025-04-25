<?php

namespace App\Http\Controllers\Stock;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StockTransferRequest;
use App\Interface\BranchInterface;
use App\Interface\StockTransferInterface;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function __construct(private StockTransferInterface $stockTransfer, private WarehouseInterface $warehouse, private BranchInterface $branch) {}

    public function index()
    {
        return Inertia::render('stock/transfer/index', [
            'stockTransfers' => $this->stockTransfer->getAll(),
        ]);
    }

    public function create()
    {
        return Inertia::render('stock/transfer/create', [
            'warehouses' => $this->warehouse->getAll(),
            'branches' => $this->branch->getAll()
        ]);
    }

    public function store(StockTransferRequest $request)
    {
        try {
            $this->stockTransfer->store($request->validated());
            return redirect()
                ->route('stock.transfer.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Stock Transfer Created',
                        'description' => 'Stock transfer has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the stock transfer. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Stock Transfer',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $stockTransfer = $this->stockTransfer->getById($id);

        if (!$stockTransfer) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Stock Transfer Not Found',
                'customDescription' => 'The stock transfer you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Stock',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Transfer',
                        'href' => route('stock.transfer.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('stock.transfer.show', $id)
                    ],
                    [
                        'title' => 'Stock Transfer Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('stock/transfer/show', [
            'stockTransfer' => $stockTransfer,
        ]);
    }

    public function getCode(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $transactionCode = TransactionCode::generateTransactionCode('Stock Transfer');
            return response()->json(['code' => $transactionCode]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
