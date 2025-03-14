<?php

namespace App\Http\Controllers\Stock;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StockAuditRequest;
use App\Interface\BranchInterface;
use App\Interface\ItemInterface;
use App\Interface\StockAuditInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAuditController extends Controller
{
    public function __construct(private StockAuditInterface $stockAudit, private BranchInterface $branch, private ItemInterface $item) {}

    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        return Inertia::render('stock/audit/index', [
            'stockAudits' => $this->stockAudit->getAll($branchId),
            'branches' => $this->branch->getAll(),
            'selectedBranchId' => $branchId,
        ]);
    }

    public function create()
    {
        return Inertia::render('stock/audit/create', [
            'branches' => $this->branch->getAll(),
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
                        'title' => 'Stock Audit',
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
        return Inertia::render('stock/audit/edit', [
            'stockAudit' => $this->stockAudit->getById($id),
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
