<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\WarehouseRequest;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function __construct(private WarehouseInterface $warehouse) {}

    public function index()
    {
        return Inertia::render('settings/warehouse/index', [
            'warehouses' => $this->warehouse->getAll(),
        ]);
    }

    public function store(WarehouseRequest $request)
    {
        try {
            $this->warehouse->store($request->validated());
            return redirect()
                ->route('warehouses.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Warehouse Created',
                        'description' => 'Warehouse has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the warehouse. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Warehouse',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(WarehouseRequest $request, $id)
    {
        try {
            $this->warehouse->update($id, $request->validated());
            return redirect()
                ->route('warehouses.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Warehouse Updated',
                        'description' => 'Warehouse has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the warehouse. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Warehouse',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->warehouse->destroy($id);
        return redirect()
            ->route('warehouses.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Warehouse Deleted',
                    'description' => 'Warehouse has been deleted successfully.'
                ]
            ]);
    }
}
