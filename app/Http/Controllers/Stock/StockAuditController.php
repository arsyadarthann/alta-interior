<?php

namespace App\Http\Controllers\Stock;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StockAuditRequest;
use App\Interface\BranchInterface;
use App\Interface\StockAuditInterface;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAuditController extends Controller
{
    public function __construct(private StockAuditInterface $stockAudit, private WarehouseInterface $warehouse ,private BranchInterface $branch) {}

    public function index(Request $request)
    {
        $sourceAbleId = $request->query('source_able_id');
        $sourceAbleType = $request->query('source_able_type');

        if ($sourceAbleType === 'Branch') {
            $stockAudits = $this->stockAudit->getAllByBranch($sourceAbleId)->appends([
                'source_able_id' => $sourceAbleId,
                'source_able_type' => $sourceAbleType,
            ]);
        } elseif ($sourceAbleType === 'Warehouse') {
            $stockAudits = $this->stockAudit->getAllByWarehouse($sourceAbleId)->appends([
                'source_able_id' => $sourceAbleId,
                'source_able_type' => $sourceAbleType,
            ]);
        } else {
            $stockAudits = $this->stockAudit->getAll();
        }

        return Inertia::render('stock/audit/index', [
            'stockAudits' => $stockAudits,
            'branches' => $this->branch->getAll(),
            'warehouses' => $this->warehouse->getAll(),
            'selectedSourceAbleId' => $sourceAbleId,
            'selectedSourceAbleType' => $sourceAbleType,
        ]);

    }

    public function create()
    {
        return Inertia::render('stock/audit/create', [
            'warehouses' => $this->warehouse->getAll(),
            'branches' => $this->branch->getAll()
        ]);
    }

    public function store(StockAuditRequest $request)
    {
        try {
            $this->stockAudit->store($request->validated());
            return redirect()
                ->route('stock.audit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Stock Audit Created',
                        'description' => 'Stock audit has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the stock audit. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Stock Audit',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $stockAudit = $this->stockAudit->getById($id);

        if (!$stockAudit) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Stock Audit Not Found',
                'customDescription' => 'The stock audit you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Stock',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Audit',
                        'href' => route('stock.audit.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('stock.audit.show', $id)
                    ],
                    [
                        'title' => 'Stock Audit Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('stock/audit/show', [
            'stockAudit' => $stockAudit,
        ]);
    }

    public function edit($id)
    {
        $stockAudit = $this->stockAudit->getById($id);

        if (request()->user()->id !== $stockAudit->user_id) {
            return redirect()
                ->route('stock.audit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Unauthorized Access',
                        'description' => 'Access denied. You do not have permission to edit this data as only the creator is allowed to make changes.',
                    ]
                ]);
        }

        if ($stockAudit->is_locked) {
            return Inertia::render('errors/error-page', [
                'status' => 423,
                'customTitle' => 'Stock Audit Locked',
                'customDescription' => 'The stock audit you are looking for is locked.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Stock',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Audit',
                        'href' => route('stock.audit.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('stock.audit.edit', $id)
                    ],
                    [
                        'title' => 'Stock Audit Locked',
                    ]
                ]
            ]);
        }

        return Inertia::render('stock/audit/edit', [
            'stockAudit' => $stockAudit,
            'warehouses' => $this->warehouse->getAll(),
            'branches' => $this->branch->getAll()
        ]);
    }

    public function update(StockAuditRequest $request, $id)
    {
        try {
            $this->stockAudit->update($id, $request->validated());
            return redirect()
                ->route('stock.audit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Stock Audit Updated',
                        'description' => 'Stock audit has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the stock audit. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Stock Audit',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $stockAudit = $this->stockAudit->getById($id);

        if (request()->user()->id !== $stockAudit->user_id) {
            return redirect()
                ->route('stock.audit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Unauthorized Access',
                        'description' => 'Access denied. You do not have permission to delete this data as only the creator is allowed to make changes.',
                    ]
                ]);
        }

        $this->stockAudit->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Stock Audit Deleted',
                    'description' => 'Stock audit has been deleted successfully.'
                ]
            ]);
    }

    public function lock($id)
    {
        $stockAudit = $this->stockAudit->getById($id);

        if (request()->user()->id !== $stockAudit->user_id) {
            return redirect()
                ->route('stock.audit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Unauthorized Access',
                        'description' => 'Access denied. You do not have permission to lock this data as only the creator is allowed to make changes.',
                    ]
                ]);
        }

        $this->stockAudit->lock($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Stock Audit Locked',
                    'description' => 'Stock audit has been locked successfully.'
                ]
            ]);
    }

    public function getCode(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $transactionCode = TransactionCode::generateTransactionCode('Stock Audit');
            return response()->json(['code' => $transactionCode]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
