<?php

namespace App\Http\Controllers\Sales;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\SalesInvoicePaymentRequest;
use App\Interface\BranchInterface;
use App\Interface\PaymentMethodInterface;
use App\Interface\SalesInvoiceInterface;
use App\Interface\SalesInvoicePaymentInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesInvoicePaymentController extends Controller
{
    public function __construct(private SalesInvoicePaymentInterface $salesInvoicePayment, private SalesInvoiceInterface $salesInvoice, private BranchInterface $branch, private PaymentMethodInterface $paymentMethod) {}

    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        if ($branchId) {
            $salesInvoicePayments = $this->salesInvoicePayment->getAll($branchId);
        } else {
            $salesInvoicePayments = $this->salesInvoicePayment->getAll();
        }

        return Inertia::render('sales/invoices/payment/index', [
            'salesInvoicePayments' => $salesInvoicePayments,
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

        return Inertia::render('sales/invoices/payment/create', [
            'code' => TransactionCode::generateTransactionCode('Sales Invoice Payment'),
            'salesInvoices' => $this->salesInvoice->getNotPaidSalesInvoiceDetails(request()->user()->branch_id),
            'paymentMethods' => $this->paymentMethod->getAll(),
        ]);
    }

    public function store(SalesInvoicePaymentRequest $request)
    {
        try {
            $this->salesInvoicePayment->store($request->validated());
            return redirect()
                ->route('sales.payment.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Sales Invoice Payment Created',
                        'description' => 'Sales invoice payment has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the sales invoice payment. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Sales Invoice Payment',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function getSalesInvoiceData(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json(['data' => $this->salesInvoice->getById($request->query('sales_invoice_id'))]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
