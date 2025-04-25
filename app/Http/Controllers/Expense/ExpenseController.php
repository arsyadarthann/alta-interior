<?php

namespace App\Http\Controllers\Expense;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\ExpenseRequest;
use App\Interface\BranchInterface;
use App\Interface\ExpenseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function __construct(private ExpenseInterface $expense, private BranchInterface $branch) {}

    public function index(Request $request)
    {
        if ($request->query('branch_id')) {
            $expenses = $this->expense->getAll($request->query('branch_id'))->appends([
                'branch_id' => $request->query('branch_id'),
            ]);
        } else {
            $expenses = $this->expense->getAll();
        }
        return Inertia::render('expense/index', [
            'expenses' => $expenses,
            'branches' => $this->branch->getAll(),
            'selectedBranchId' => $request->query('branch_id'),
        ]);
    }

    public function create()
    {
        return Inertia::render('expense/create', [
            'transactionCode' => TransactionCode::generateTransactionCode('Expense'),
            'branches' => $this->branch->getAll(),
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
