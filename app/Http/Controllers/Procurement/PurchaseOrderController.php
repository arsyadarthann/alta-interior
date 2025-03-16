<?php

namespace App\Http\Controllers\Procurement;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\PurchaseOrderRequest;
use App\Interface\BranchInterface;
use App\Interface\PurchaseOrderInterface;
use App\Interface\SupplierInterface;
use App\Interface\TaxRateInterface;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function __construct(private PurchaseOrderInterface $purchaseOrder, private SupplierInterface $supplier, private TaxRateInterface $taxRate) {}

    public function index(Request $request)
    {
        return Inertia::render('procurement/order/index', [
            'purchaseOrders' => $this->purchaseOrder->getAll(),
        ]);
    }

    public function create()
    {
        return Inertia::render('procurement/order/create', [
            'suppliers' => $this->supplier->getAll(),
            'taxRates' => $this->taxRate->getAll(),
        ]);
    }

    public function store(PurchaseOrderRequest $request)
    {
        try {
            $this->purchaseOrder->store($request->validated());
            return redirect()
                ->route('procurement.order.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Purchase Order Created',
                        'description' => 'Purchase order has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the purchase order. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Purchase Order',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $purchaseOrder = $this->purchaseOrder->getById($id);

        if (!$purchaseOrder) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Purchase Order Not Found',
                'customDescription' => 'The purchase order you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Purchase Order',
                        'href' => route('procurement.order.index')
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('procurement.order.show', $id)
                    ],
                    [
                        'title' => 'Purchase Order Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('procurement/order/show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function edit($id)
    {
        $purchaseOrder = $this->purchaseOrder->getById($id);

        if (!$purchaseOrder) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Purchase Order Not Found',
                'customDescription' => 'The purchase order you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Purchase Order',
                        'href' => route('procurement.order.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('procurement.order.edit', $id)
                    ],
                    [
                        'title' => 'Purchase Order Not Found',
                    ]
                ]
            ]);
        }

        if ($purchaseOrder->status !== 'pending') {
            return Inertia::render('errors/error-page', [
                'status' => 422,
                'customTitle' => 'Purchase Order is Processed',
                'customDescription' => 'The purchase order cannot be edited because it has already been processed. Only purchase orders with "Pending" status can be modified.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#'
                    ],
                    [
                        'title' => 'Purchase Order',
                        'href' => route('procurement.order.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('procurement.order.edit', $id)
                    ],
                    [
                        'title' => 'Purchase Order is Processed',
                    ]
                ]
            ]);
        }

        return Inertia::render('procurement/order/edit', [
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => $this->supplier->getAll(),
            'taxRates' => $this->taxRate->getAll(),
        ]);
    }

    public function update(PurchaseOrderRequest $request, $id)
    {
        try {
            $this->purchaseOrder->update($id, $request->validated());
            return redirect()
                ->route('procurement.order.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Purchase Order Updated',
                        'description' => 'Purchase order has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the purchase order. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Purchase Order',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->purchaseOrder->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Purchase Order Deleted',
                    'description' => 'Purchase order has been deleted successfully.'
                ]
            ]);
    }

    public function getCode(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $transactionCode = TransactionCode::generateTransactionCode('Purchase Order');
            return response()->json(['code' => $transactionCode]);
        }
    }

    public function generatePdf($id)
    {
        $purchaseOrder = $this->purchaseOrder->getById($id);

        $pdf = PDF::loadView('pdf.purchase-order', [
            'purchaseOrder' => json_decode($purchaseOrder),
            'notes' => 'Please deliver the items to our office as per the mentioned delivery date.',
            'userPosition' => 'Purchasing Officer'
        ]);

        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'sans-serif'
        ]);

        return $pdf->stream( 'res.pdf');
    }

}
