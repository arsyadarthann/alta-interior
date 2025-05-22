<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\CustomerRequest;
use App\Interface\BranchInterface;
use App\Interface\CustomerInterface;
use App\Interface\ItemInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function __construct(private CustomerInterface $customer, private ItemInterface $item) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);

        return Inertia::render('master/customers/index', [
            'customers' => $this->customer->getAll($filters),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('master/customers/create', [
            'items' => $this->item->getAll(),
        ]);
    }

    public function store(CustomerRequest $request)
    {
        try {
            $this->customer->store($request->validated());
            return redirect()
                ->route('customers.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Customer Created',
                        'description' => 'Customer has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the customer. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Customer',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $customer = $this->customer->showById($id);

        if (!$customer) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Customer Not Found',
                'customDescription' => 'The customer you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Customers',
                        'href' => route('customers.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('customers.show', $id)
                    ],
                    [
                        'title' => 'Customer Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('master/customers/show', [
            'customer' => $customer,
            'customerPricesPagination' => [
                'current_page' => $customer->customerPrices->currentPage(),
                'last_page' => $customer->customerPrices->lastPage(),
                'per_page' => $customer->customerPrices->perPage(),
                'total' => $customer->customerPrices->total(),
            ]
        ]);
    }

    public function edit($id)
    {
        $customer = $this->customer->editById($id);

        if (!$customer) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Customer Not Found',
                'customDescription' => 'The customer you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Customers',
                        'href' => route('customers.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('customers.edit', $id)
                    ],
                    [
                        'title' => 'Customer Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('master/customers/edit', [
            'customer' => $customer,
            'items' => $this->item->getAll(),
        ]);
    }

    public function update(CustomerRequest $request, $id)
    {
        try {
            $this->customer->update($id, $request->validated());
            return redirect()
                ->route('customers.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Customer Updated',
                        'description' => 'Customer has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the customer. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Customer',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->customer->destroy($id);
        return redirect()
            ->route('customers.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Customer Deleted',
                    'description' => 'Customer has been deleted successfully.'
                ]
            ]);
    }

    public function getPrices(Request $request)
    {
        $customerId = $request->query('customer_id');
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->customer->getCustomerPricesById($customerId));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
