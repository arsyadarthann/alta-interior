<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ItemRequest;
use App\Interface\BranchInterface;
use App\Interface\ItemCategoryInterface;
use App\Interface\ItemInterface;
use App\Interface\ItemUnitInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function __construct(private ItemInterface $item, private ItemCategoryInterface $itemCategory, private itemUnitInterface $itemUnit, private BranchInterface $branch) {}

    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        return Inertia::render('inventory/item/index', [
            'items' => $this->item->getAll($branchId),
            'itemCategories' => $this->itemCategory->getAll(),
            'itemUnits' => $this->itemUnit->getAll(),
            'branches' => $this->branch->getAll(),
            'selectedBranchId' => $branchId
        ]);
    }

    public function store(ItemRequest $request)
    {
        try {
            $this->item->store($request->validated());
            $branchId = $request->input('branch_id');
            return redirect()
                ->route('item.index', ['branch_id' => $branchId])
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Created',
                        'description' => 'Item has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the item. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Item',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(ItemRequest $request, $id)
    {
        try {
            $this->item->update($id, $request->validated());
            $branchId = $request->input('branch_id');
            return redirect()
                ->route('item.index', ['branch_id' => $branchId])
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Updated',
                        'description' => 'Item has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the item. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Item',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->item->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Item Deleted',
                    'description' => 'Item has been deleted successfully.'
                ]
            ]);
    }

    public function getItemByBranch(Request $request, $branchId)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->item->getAll($branchId));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getItemStockByBranch(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $itemId = $request->query('item_id');
            $branchId = $request->query('branch_id');
            return response()->json(['stock' => $this->item->sumStock($itemId, $branchId)]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
