<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ItemWholesaleUnitRequest;
use App\Interface\ItemWholesaleUnitInterface;
use Inertia\Inertia;

class ItemWholesaleUnitController extends Controller
{
    public function __construct(private ItemWholesaleUnitInterface $itemUnit) {}

    public function index()
    {
        return Inertia::render('inventory/wholesale-unit/index', [
            'itemWholesaleUnits' => $this->itemUnit->getAll()
        ]);
    }

    public function store(ItemWholesaleUnitRequest $request)
    {
        try {
            $this->itemUnit->store($request->validated());
            return redirect()
                ->route('wholesale-unit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Wholesale Unit Created',
                        'description' => 'Item wholesale unit has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the item wholesale unit. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Item Unit',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(ItemWholesaleUnitRequest $request, $id)
    {
        try {
            $this->itemUnit->update($id, $request->validated());
            return redirect()
                ->route('wholesale-unit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Wholesale Unit Updated',
                        'description' => 'Item wholesale unit has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the item wholesale unit. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Item Wholesale Unit',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->itemUnit->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Item Wholesale Unit Deleted',
                    'description' => 'Item wholesale unit has been deleted successfully.'
                ]
            ]);
    }
}
