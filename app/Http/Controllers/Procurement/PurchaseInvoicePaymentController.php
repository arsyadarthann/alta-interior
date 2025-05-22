<?php

namespace App\Http\Controllers\Procurement;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\PurchaseInvoicePaymentRequest;
use App\Interface\PaymentMethodInterface;
use App\Interface\PurchaseInvoiceInterface;
use App\Interface\PurchaseInvoicePaymentInterface;
use App\Interface\SupplierInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseInvoicePaymentController extends Controller
{
    public function __construct(private PurchaseInvoicePaymentInterface $purchaseInvoicePayment, private PurchaseInvoiceInterface $purchaseInvoice, private SupplierInterface $supplier, private PaymentMethodInterface $paymentMethod) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        return Inertia::render('procurement/invoices/payment/index', [
            'purchaseInvoicePayments' => $this->purchaseInvoicePayment->getAll($filters),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('procurement/invoices/payment/create', [
            'code' => TransactionCode::generateTransactionCode('Purchase Invoice Payment'),
            'suppliers' => $this->supplier->getAll(),
            'paymentMethods' => $this->paymentMethod->getAll(),
        ]);
    }

    public function store(PurchaseInvoicePaymentRequest $request)
    {
        try {
            $this->purchaseInvoicePayment->store($request->validated());
            return redirect()
                ->route('procurement.payment.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Supplier Invoice Payment Created',
                        'description' => 'Invoice Payment has been created successfully.',
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating supplier Invoice Payment. Please try again.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'error',
                        'title' => 'Error Creating Supplier Invoice Payment',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $purchaseInvoicePayment = $this->purchaseInvoicePayment->getById($id);

        if (!$purchaseInvoicePayment) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Purchase Invoice Payment Not Found',
                'customDescription' => 'The purchase invoices payment you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Invoice Payment',
                        'href' => route('procurement.payment.index'),
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('procurement.payment.show', $id),
                    ],
                    [
                        'title' => 'Supplier Invoice Payment Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('procurement/invoices/payment/show', [
            'purchaseInvoicePayment' => $purchaseInvoicePayment,
        ]);
    }

    public function getNotPaidPurchaseInvoice(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->purchaseInvoice->getNotPaid($request->query('supplier_id')));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }

    public function getPurchaseInvoiceData(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json(['data' => $this->purchaseInvoice->getById($request->query('purchase_invoice_id'))]);
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
