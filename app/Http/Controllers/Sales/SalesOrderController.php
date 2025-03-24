<?php

namespace App\Http\Controllers\Sales;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\SalesOrderRequest;
use App\Interface\BranchInterface;
use App\Interface\CustomerInterface;
use App\Interface\SalesOrderInterface;
use App\Interface\TaxRateInterface;
use App\Interface\WarehouseInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesOrderController extends Controller
{
    public function __construct(private SalesOrderInterface $salesOrder, private CustomerInterface $customer, private BranchInterface $branch, private WarehouseInterface $warehouse, private TaxRateInterface $taxRate) {}

    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        if ($branchId) {
            $salesOrders = $this->salesOrder->getAll($branchId);
        } else {
            $salesOrders = $this->salesOrder->getAll();
        }

        return Inertia::render('sales/order/index', [
            'salesOrders' => $salesOrders,
            'branches' => $this->branch->getAll(),
            'selectedBranchId' => $branchId,
        ]);
    }

    public function create()
    {
        return Inertia::render('sales/order/create', [
            'customers' => $this->customer->getAllNoPaginate(),
            'warehouses' => $this->warehouse->getAll(),
            'taxRates' => $this->taxRate->getAll(),
            'branches' => $this->branch->getAll(),
        ]);
    }

    public function store(SalesOrderRequest $request)
    {
        try {
            $this->salesOrder->store($request->validated());
            return redirect()
                ->route('sales.order.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Sales Order Created',
                        'description' => 'Sales order has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the sales order. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Sales Order',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $salesOrder = $this->salesOrder->getById($id);

        if (!$salesOrder) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Sales Order Not Found',
                'customDescription' => 'The sales order you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Order',
                        'href' => route('sales.order.index'),
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('sales.order.show', $id),
                    ],
                    [
                        'title' => 'Sales Order Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('sales/order/show', [
            'salesOrder' => $salesOrder,
        ]);
    }

    public function edit($id)
    {
        $salesOrder = $this->salesOrder->getById($id);

        if (!$salesOrder) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Sales Order Not Found',
                'customDescription' => 'The sales order you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Order',
                        'href' => route('sales.order.index'),
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('sales.order.show', $id),
                    ],
                    [
                        'title' => 'Sales Order Not Found',
                    ]
                ]
            ]);
        }

        if ($salesOrder->status != 'pending') {
            return Inertia::render('errors/error-page', [
                'status' => 423,
                'customTitle' => 'Sales Order Cannot Be Edited',
                'customDescription' => 'This sales order cannot be edited because it is already in ' . ucfirst($salesOrder->status) . ' status.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Order',
                        'href' => route('sales.order.index'),
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('sales.order.edit', $id),
                    ],
                    [
                        'title' => ucfirst($salesOrder->status)
                    ]
                ]
            ]);
        }

        return Inertia::render('sales/order/edit', [
            'salesOrder' => $salesOrder,
            'customers' => $this->customer->getAllNoPaginate(),
            'warehouses' => $this->warehouse->getAll(),
            'taxRates' => $this->taxRate->getAll(),
            'branches' => $this->branch->getAll(),
        ]);
    }

    public function update(SalesOrderRequest $request, $id)
    {
        try {
            $this->salesOrder->update($id, $request->validated());
            return redirect()
                ->route('sales.order.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Sales Order Updated',
                        'description' => 'Sales order has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the sales order. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Sales Order',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->salesOrder->delete($id);
        return redirect()
            ->route('sales.order.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Sales Order Deleted',
                    'description' => 'Sales order has been deleted successfully.'
                ]
            ]);
    }

    public function getCode(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $transactionCode = TransactionCode::generateTransactionCode('Sales Order');
            return response()->json(['code' => $transactionCode]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
