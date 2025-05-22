<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\SupplierRequest;
use App\Interface\SupplierInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function __construct(private SupplierInterface $supplier) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);

        return Inertia::render('master/suppliers/index', [
            'suppliers' => $this->supplier->getAllPaginate($filters),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('master/suppliers/create');
    }

    public function store(SupplierRequest $request)
    {
        try {
            $this->supplier->store($request->validated());
            return redirect()
                ->route('suppliers.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Supplier Created',
                        'description' => 'Supplier has been created successfully.',
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the supplier. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Supplier',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function edit(int $id)
    {
        $supplier = $this->supplier->getById($id);

        if (!$supplier) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Supplier Not Found',
                'customDescription' => 'The supplier you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Suppliers',
                        'href' => route('suppliers.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('suppliers.edit', $id)
                    ],
                    [
                        'title' => 'Supplier Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('master/suppliers/edit', [
            'supplier' => $supplier
        ]);
    }

    public function update(SupplierRequest $request, int $id)
    {
        try {
            $this->supplier->update($id, $request->validated());
            return redirect()
                ->route('suppliers.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Supplier Updated',
                        'description' => 'Supplier has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = config('app.env') === 'production'
                ? 'An error occurred while updating the supplier. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Supplier',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy(int $id)
    {
        $this->supplier->destroy($id);
        return redirect()
            ->route('suppliers.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Supplier Deleted',
                    'description' => 'Supplier has been deleted successfully.'
                ]
            ]);
    }
}
