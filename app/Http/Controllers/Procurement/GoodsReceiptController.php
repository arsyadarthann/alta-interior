<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\GoodsReceiptRequest;
use App\Interface\GoodsReceiptInterface;
use App\Interface\SupplierInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GoodsReceiptController extends Controller
{
    public function __construct(private GoodsReceiptInterface $goodsReceipt, private SupplierInterface $supplier) {}

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
        return Inertia::render('procurement/goods-receipt/show', [
            'goodsReceipt' => $this->goodsReceipt->getById($id),
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
