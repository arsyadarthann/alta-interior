<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\ExpenseInterface;
use App\Models\Expense;
use Illuminate\Support\Facades\DB;

class ExpenseRepository implements ExpenseInterface
{
    public function __construct(private Expense $expense) {}

    public function getAll($branchId = null)
    {
        return $this->expense
            ->with([
                'branch:id,name', 'user:id,name'
            ])
            ->when($branchId, function ($query) use ($branchId) {
                return $query->where('branch_id', $branchId);
            })
            ->orderBy('id', 'desc')
            ->paginate(10);
    }

    public function getById(int $id)
    {
        return $this->expense->with([
            'branch:id,name', 'user:id,name', 'expenseDetails'
        ])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $expense = $this->expense->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'branch_id' => $data['branch_id'],
                'total_amount' => $data['total_amount'],
                'user_id' => request()->user()->id,
            ]);

            foreach ($data['expense_details'] as $expenseDetail) {
                $expense->expenseDetails()->create([
                    'name' => $expenseDetail['name'],
                    'amount' => $expenseDetail['amount'],
                ]);
            }

            TransactionCode::confirmTransactionCode('Expense', $data['code']);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $expense = $this->getById($id);
            $expense->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'branch_id' => $data['branch_id'],
                'total_amount' => $data['total_amount'],
                'user_id' => request()->user()->id,
            ]);

            $submittedIds = collect($data['expense_details'])->pluck('id')->filter()->toArray();

            $expense->expenseDetails()->whereNotIn('id', $submittedIds)->delete();

            foreach ($data['expense_details'] as $expenseDetail) {
                $expense->expenseDetails()->updateOrCreate([
                    'id' => $expenseDetail['id'] ?? null
                ], [
                    'name' => $expenseDetail['name'],
                    'amount' => $expenseDetail['amount'],
                ]);
            }
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $expense = $this->getById($id);
            $code = $expense->code;
            $expense->expenseDetails()->delete();
            $expense->delete();
            TransactionCode::cancelTransactionCode('Expense', $code);
        });
    }

    public function lockExpense(int $id)
    {
        return DB::transaction(function () use ($id) {
            $expense = $this->getById($id);
            $expense->update([
                'is_locked' => true,
            ]);
        });
    }
}
