<?php

namespace App\Http\Controllers\Expense;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\ExpenseRequest;
use App\Interface\BranchInterface;
use App\Interface\ExpenseInterface;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function __construct(private ExpenseInterface $expense, private BranchInterface $branch, private WarehouseInterface $warehouse) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        $sourceAbleId = $request->query('source_able_id');
        $sourceAbleType = $request->query('source_able_type');

        if ($sourceAbleId) {
            $expenses = $this->expense->getAll($filters, $sourceAbleId, $sourceAbleType)->appends([
                'source_able_id' => $sourceAbleId,
                'source_able_type' => $sourceAbleType,
            ]);
        } else {
            $expenses = $this->expense->getAll($filters);
        }

        return Inertia::render('expense/index', [
            'expenses' => $expenses,
            'branches' => $this->branch->getAll(),
            'warehouses' => $this->warehouse->getAll(),
            'selectedSourceAbleId' => $sourceAbleId,
            'selectedSourceAbleType' => $sourceAbleType,
            'filters' => $filters
        ]);
    }

    public function create()
    {
        return Inertia::render('expense/create', [
            'transactionCode' => TransactionCode::generateTransactionCode('Expense'),
            'branches' => $this->branch->getAll(),
            'warehouses' => $this->warehouse->getAll(),
        ]);
    }

    public function store(ExpenseRequest $request)
    {
        try {
            $this->expense->store($request->validated());
            return redirect()
                ->route('expense.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Expense Created',
                        'description' => 'Expense has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the expense. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Expense',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show(int $id)
    {
        $expense = $this->expense->getById($id);

        if (!$expense) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Expense Not Found',
                'customDescription' => 'The expense you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Finance',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Expense',
                        'href' => route('expense.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('expense.show', $id)
                    ],
                    [
                        'title' => 'Expense Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('expense/show', [
            'expense' => $expense,
        ]);
    }

    public function edit(int $id)
    {
        $expense = $this->expense->getById($id);

        if (!$expense) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Expense Not Found',
                'customDescription' => 'The expense you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Finance',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Expense',
                        'href' => route('expense.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('expense.show', $id)
                    ],
                    [
                        'title' => 'Expense Not Found',
                    ]
                ]
            ]);
        }

        if ($expense->is_locked) {
            return Inertia::render('errors/error-page', [
                'status' => 423,
                'customTitle' => 'Expense Locked',
                'customDescription' => 'The expense you are looking for is locked.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Finance',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Expense',
                        'href' => route('expense.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('expense.edit', $id)
                    ],
                    [
                        'title' => 'Expense Locked',
                    ]
                ]
            ]);
        }

        return Inertia::render('expense/edit', [
            'expense' => $expense,
            'branches' => $this->branch->getAll(),
            'warehouses' => $this->warehouse->getAll(),
        ]);
    }

    public function update(ExpenseRequest $request, int $id)
    {
        try {
            $this->expense->update($id, $request->validated());
            return redirect()
                ->route('expense.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Expense Updated',
                        'description' => 'Expense has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the expense. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Expense',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy(int $id)
    {
        $this->expense->destroy($id);
        return redirect()
            ->route('expense.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Expense Deleted',
                    'description' => 'Expense has been deleted successfully.'
                ]
            ]);
    }

    public function lockExpense(int $id)
    {
        $this->expense->lockExpense($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Expense Locked',
                    'description' => 'Expense has been locked successfully.'
                ]
            ]);
    }
}
