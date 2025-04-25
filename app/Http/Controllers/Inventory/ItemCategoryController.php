<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\ItemCategoryRequest;
use App\Interface\ItemCategoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemCategoryController extends Controller
{
    public function __construct(private ItemCategoryInterface $itemCategory) {}

    public function index()
    {
        return Inertia::render('inventory/category/index', [
            'itemCategories' => $this->itemCategory->getAll()
        ]);
    }

    public function store(ItemCategoryRequest $request)
    {
        try {
            $this->itemCategory->store($request->validated());
            return redirect()
                ->route('category.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Category Created',
                        'description' => 'Item category has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the item category. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Item Category',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(ItemCategoryRequest $request, $id)
    {
        try {
            $this->itemCategory->update($id, $request->validated());
            return redirect()
                ->route('category.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Item Category Updated',
                        'description' => 'Item category has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the item category. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Item Category',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->itemCategory->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Item Category Deleted',
                    'description' => 'Item category has been deleted successfully.'
                ]
            ]);
    }
}
