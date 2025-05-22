<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ItemRequest;
use App\Interface\BranchInterface;
use App\Interface\ItemCategoryInterface;
use App\Interface\ItemInterface;
use App\Interface\ItemUnitInterface;
use App\Interface\ItemWholesaleUnitInterface;
use App\Interface\WarehouseInterface;
use App\Models\Branch;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemController extends Controller
{
    public function __construct(private ItemInterface $item, private ItemCategoryInterface $itemCategory, private ItemWholesaleUnitInterface $itemWholesaleUnit, private itemUnitInterface $itemUnit, private WarehouseInterface $warehouse, private BranchInterface $branch) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        $sourceAbleId = $request->query('source_able_id');
        $sourceAbleType = $request->query('source_able_type');
        if ($sourceAbleType === 'Branch') {
            $items = $this->item->getAllPaginateByBranch($filters, $sourceAbleId);
        } elseif ($sourceAbleType === 'Warehouse') {
            $items = $this->item->getAllPaginateByWarehouse($filters, $sourceAbleId);
        } else {
            $items = $this->item->getAllPaginate($filters);
        }

        return Inertia::render('inventory/item/index', [
            'items' => $items->appends([
                'source_able_id' => $sourceAbleId,
                'source_able_type' => $sourceAbleType,
            ]),
            'itemCategories' => $this->itemCategory->getAll(),
            'itemWholesaleUnits' => $this->itemWholesaleUnit->getAll(),
            'itemUnits' => $this->itemUnit->getAll(),
            'warehouses' => $this->warehouse->getAll(),
            'branches' => $this->branch->getAll(),
            'selectedSourceAbleId' => $sourceAbleId,
            'selectedSourceAbleType' => $sourceAbleType,
            'filters' => $filters,
        ]);
    }

    public function store(ItemRequest $request)
    {
        try {
            $this->item->store($request->validated());
            $sourceAbleId = $request->query('source_able_id');
            $sourceAbleType = $request->query('source_able_type');
            return redirect()
                ->route('item.index', ['source_able_id' => $sourceAbleId, 'source_able_type' => $sourceAbleType])
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
            $sourceAbleId = $request->query('source_able_id');
            $sourceAbleType = $request->query('source_able_type');
            return redirect()
                ->route('item.index', ['source_able_id' => $sourceAbleId, 'source_able_type' => $sourceAbleType])
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

    public function getItemBatch(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $itemId = $request->query('item_id');
            $sourceAbleId = $request->query('source_able_id');
            $sourceAbleType = $request->query('source_able_type');
            $results = $this->item->getPaginateBatch($itemId, $sourceAbleId, $sourceAbleType);
            return $results->appends([
                'item_id' => $itemId,
                'source_able_id' => $sourceAbleId,
                'source_able_type' => $sourceAbleType,
            ]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getAllOnlyItems(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->item->getAllOnlyItem());
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getItems(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->item->getAll());
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getItemByWarehouse(Request $request, $warehouseId)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->item->getAllByWarehouse($warehouseId));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getItemStockByWarehouse(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $itemId = $request->query('item_id');
            $warehouseId = $request->query('source_able_id');
            return response()->json(['stock' => $this->item->sumStockByWarehouse($itemId, $warehouseId)]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getItemByBranch(Request $request, $branchId)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->item->getAllByBranch($branchId));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getItemStockByBranch(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $itemId = $request->query('item_id');
            $branchId = $request->query('source_able_id');
            return response()->json(['stock' => $this->item->sumStockByBranch($itemId, $branchId)]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
