<?php

namespace App\Http\Controllers\Sales;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\SalesInvoiceRequest;
use App\Interface\BranchInterface;
use App\Interface\CustomerInterface;
use App\Interface\PaymentMethodInterface;
use App\Interface\SalesInvoiceInterface;
use App\Interface\TaxRateInterface;
use App\Interface\WaybillInterface;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesInvoiceController extends Controller
{
    public function __construct(private SalesInvoiceInterface $salesInvoice, private WaybillInterface $waybill, private BranchInterface $branch, private CustomerInterface $customer, private TaxRateInterface $taxRate, private PaymentMethodInterface $paymentMethod) {}

    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        if ($branchId) {
            $salesInvoices = $this->salesInvoice->getAll($branchId);
        } else {
            $salesInvoices = $this->salesInvoice->getAll();
        }

        return Inertia::render('sales/invoices/invoice/index', [
            'salesInvoices' => $salesInvoices,
            'branches' => $this->branch->getAll(),
            'selectedBranchId' => $branchId,
        ]);
    }

    public function create(Request $request)
    {
        $request->merge([
            'source_able_id' => $request->user()->branch_id,
            'source_able_type' => 'branch'
        ]);

        return Inertia::render('sales/invoices/invoice/create', [
            'code' => TransactionCode::generateTransactionCode('Sales Invoice'),
            'waybills' => $this->waybill->getWaybillNotInvoiced($request->user()->branch_id),
            'customers' => $this->customer->getAllNoPaginate(),
            'taxRates' => $this->taxRate->getAll(),
            'paymentMethods' => $this->paymentMethod->getAll(),
        ]);
    }

    public function store(SalesInvoiceRequest $request)
    {
        try {
            $this->salesInvoice->store($request->validated());
            return redirect()
                ->route('sales.invoices.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Sales Invoice Created',
                        'description' => 'Sales Invoice has been created successfully.',
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the waybill. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Sales Invoice',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $salesInvoice = $this->salesInvoice->getById($id);

        if (!$salesInvoice) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Sales Invoice Not Found',
                'customDescription' => 'The sales invoices you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('sales.invoices.index'),
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('sales.invoices.show', $id),
                    ],
                    [
                        'title' => 'Sales Invoice Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('sales/invoices/invoice/show', [
            'salesInvoice' => $salesInvoice,
        ]);
    }

    public function edit($id)
    {
        $salesInvoice = $this->salesInvoice->getById($id);

        if (!$salesInvoice) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Sales Invoice Not Found',
                'customDescription' => 'The sales invoices you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('sales.invoices.index'),
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('sales.invoices.edit', $id),
                    ],
                    [
                        'title' => 'Sales Invoice Not Found',
                    ]
                ]
            ]);
        }

        if ($salesInvoice->paid_status != 'unpaid') {
            return Inertia::render('errors/error-page', [
                'status' => 423,
                'customTitle' => 'Sales Invoice Cannot Be Edited',
                'customDescription' => 'This sales invoices cannot be edited because it is already in ' . ucfirst($salesInvoice->paid_status) . ' status.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('sales.invoices.index'),
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('sales.invoices.edit', $id),
                    ],
                    [
                        'title' => ucfirst($salesInvoice->status)
                    ]
                ]
            ]);
        }

        return Inertia::render('sales/invoices/invoice/edit', [
            'salesInvoice' => $salesInvoice,
            'waybills' => $this->waybill->getWaybillNotInvoiced($salesInvoice->branch_id),
            'customers' => $this->customer->getAllNoPaginate(),
            'taxRates' => $this->taxRate->getAll(),
            'paymentMethods' => $this->paymentMethod->getAll(),
        ]);
    }

    public function update(SalesInvoiceRequest $request, $id)
    {
        try {
            $this->salesInvoice->update($request->validated(), $id);
            return redirect()
                ->route('sales.invoices.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Sales Invoice Updated',
                        'description' => 'Sales Invoice has been updated successfully.',
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the sales invoices. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Sales Invoice',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function getWaybillData(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->waybill->getById($request->query('waybill_id')));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function generatePdf($id)
    {
        $salesInvoice = $this->salesInvoice->getById($id);

        if (!$salesInvoice) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Sales Invoice Not Found',
                'customDescription' => 'The sales invoices you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Sales',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice',
                        'href' => route('sales.invoices.index'),
                    ],
                    [
                        'title' => 'Print',
                        'href' => route('sales.invoices.generate-pdf', $id),
                    ],
                    [
                        'title' => 'Sales Invoice Not Found',
                    ]
                ]
            ]);
        }

        $pdf = PDF::loadView('pdf.sales-invoice', [
            'salesInvoice' => $salesInvoice
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'sans-serif'
        ]);

        return $pdf->stream($salesInvoice->code . '.pdf');
    }

    public function destroy($id)
    {
        $this->salesInvoice->delete($id);
        return redirect()
            ->route('sales.invoices.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Sales Invoice Deleted',
                    'description' => 'Sales Invoice has been deleted successfully.',
                ]
            ]);
    }
}
