<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\GoodsReceiptRequest;
use App\Interface\GoodsReceiptInterface;
use App\Interface\SupplierInterface;
use App\Interface\TaxRateInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{
    public function __construct(private GoodsReceiptInterface $goodsReceipt, private SupplierInterface $supplier, private taxRateInterface $taxRate) {}

    public function index()
    {
        return Inertia::render('procurement/goods-receipt/index', [
            'goodsReceipts' => $this->goodsReceipt->getAll(),
        ]);
    }

    public function create()
    {
        return Inertia::render('procurement/goods-receipt/create', [
            'suppliers' => $this->supplier->getAll(),
            'taxRates' => $this->taxRate->getAll()
        ]);
    }

    public function store(GoodsReceiptRequest $request)
    {
        try {
            $this->goodsReceipt->store($request->validated());
            return redirect()
                ->route('procurement.receipt.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Goods Receipt Created',
                        'description' => 'Goods receipt has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the goods receipt. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Goods Receipt',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        $goodsReceipt = $this->goodsReceipt->getById($id);

        if (!$goodsReceipt) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Goods Receipt Not Found',
                'customDescription' => 'The goods receipt you are looking for could not be found.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Procurement',
                        'href' => '#',
                    ],
                    [
                        'title' => 'Goods Receipt',
                        'href' => route('procurement.receipt.index'),
                    ],
                    [
                        'title' => 'Show',
                        'href' => route('procurement.receipt.show', $id),
                    ],
                    [
                        'title' => 'Goods Receipt Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('procurement/goods-receipt/show', [
            'goodsReceipt' => $goodsReceipt,
        ]);
    }

    public function getUnreceivedPurchaseOrderDetails(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return response()->json($this->goodsReceipt->getUnreceivedPurchaseOrderDetails($request->query('supplier_id')));
        }

        return Inertia::render('errors/error-page', [
            'status' => 404,
        ]);
    }
}
