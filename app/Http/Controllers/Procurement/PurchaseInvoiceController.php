<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\PurchaseInvoiceRequest;
use App\Interface\GoodsReceiptInterface;
use App\Interface\PurchaseInvoiceInterface;
use App\Interface\SupplierInterface;
use App\Interface\TaxRateInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseInvoiceController extends Controller
{
    public function __construct(private PurchaseInvoiceInterface $purchaseInvoice, private GoodsReceiptInterface $goodsReceipt, private SupplierInterface $supplier, private TaxRateInterface $taxRate) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        return Inertia::render('procurement/invoices/invoice/index', [
            'purchaseInvoices' => $this->purchaseInvoice->getAll($filters),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('procurement/invoices/invoice/create', [
            'suppliers' => $this->supplier->getAll(),
        ]);
    }

    public function store(PurchaseInvoiceRequest $request)
    {
        try {
            $this->purchaseInvoice->store($request->validated());
            return redirect()
                ->route('procurement.invoices.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Supplier Invoice Created',
                        'description' => 'Supplier Invoice has been created successfully.',
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating supplier invoices. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error creating supplier invoices',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $purchaseInvoice = $this->purchaseInvoice->getById($id);

        if (!$purchaseInvoice) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Supplier Invoice Not Found',
                'customDescription' => 'The supplier invoices you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('procurement.invoices.index'),
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('procurement.invoices.show', $id),
                    ],
                    [
                        'title' => 'Supplier Invoice Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('procurement/invoices/invoice/show', [
            'purchaseInvoice' => $purchaseInvoice
        ]);
    }

    public function edit($id)
    {
        $purchaseInvoice = $this->purchaseInvoice->getById($id);

//        return response()->json([
//            'purchaseInvoice' => $purchaseInvoice,
//            'suppliers' => $this->supplier->getAll(),
//        ]);

        if (!$purchaseInvoice) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Supplier Invoice Not Found',
                'customDescription' => 'The supplier invoices you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('procurement.invoices.index'),
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('procurement.invoices.edit', $id),
                    ],
                    [
                        'title' => 'Supplier Invoice Not Found',
                    ]
                ]
            ]);
        }

        if ($purchaseInvoice->status != 'unpaid') {
            if ($purchaseInvoice->status == 'partially_paid') {
                $statusDisplay = 'Partially Paid';
            } else {
                $statusDisplay = ucfirst($purchaseInvoice->status);
            }

            return Inertia::render('errors/error-page', [
                'status' => 423,
                'customTitle' => 'Purchase Invoice Cannot Be Edited',
                'customDescription' => 'This invoices cannot be edited because it is already in ' . $statusDisplay . ' status.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('procurement.invoices.index'),
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('procurement.invoices.edit', $id),
                    ],
                    [
                        'title' => 'Status Error',
                    ]
                ]
            ]);
        }

        return Inertia::render('procurement/invoices/invoice/edit', [
            'purchaseInvoice' => $purchaseInvoice,
            'suppliers' => $this->supplier->getAll(),
        ]);
    }

    public function update(PurchaseInvoiceRequest $request, $id)
    {
        try {
            $this->purchaseInvoice->update($id, $request->validated());
            return redirect()
                ->route('procurement.invoices.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Supplier Invoice Updated',
                        'description' => 'Supplier Invoice has been updated successfully.',
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating supplier invoices. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error updating supplier invoices',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->purchaseInvoice->destroy($id);
        return redirect()
            ->route('procurement.invoices.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Supplier Invoice Deleted',
                    'description' => 'Supplier Invoice has been deleted successfully.',
                ]
            ]);
    }

    public function getNotInvoicedGoodsReceipts(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->purchaseInvoice->getNotInvoicedGoodsReceipts($request->query('supplier_id')));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404
        ]);
    }

    public function getGoodsReceiptData(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->goodsReceipt->getById($request->query('goods_receipt_id')));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404
        ]);
    }
}
