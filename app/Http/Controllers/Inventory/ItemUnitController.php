<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ItemUnitRequest;
use App\Interface\ItemUnitInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemUnitController extends Controller
{
    public function __construct(private ItemUnitInterface $itemUnit) {}

    public function index()
    {
        return Inertia::render('inventory/unit/index', [
            'itemUnits' => $this->itemUnit->getAll()
        ]);
    }

    public function store(ItemUnitRequest $request)
    {
        try {
            $this->itemUnit->store($request->validated());
            return redirect()
                ->route('unit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Unit Created',
                        'description' => 'Item unit has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the item unit. Please try again later.'
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

    public function update(ItemUnitRequest $request, $id)
    {
        try {
            $this->itemUnit->update($id, $request->validated());
            return redirect()
                ->route('unit.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Unit Updated',
                        'description' => 'Item unit has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the item unit. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Item Unit',
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
                    'title' => 'Item Unit Deleted',
                    'description' => 'Item unit has been deleted successfully.'
                ]
            ]);
    }
}
