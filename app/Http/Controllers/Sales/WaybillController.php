<?php

namespace App\Http\Controllers\Sales;

use App\Helpers\TransactionCode;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\WaybillRequest;
use App\Interface\BranchInterface;
use App\Interface\SalesOrderInterface;
use App\Interface\WaybillInterface;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WaybillController extends Controller
{
    public function __construct(private WaybillInterface $waybill, private SalesOrderInterface $salesOrder, private BranchInterface $branch) {}

    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        if ($branchId) {
            $waybills = $this->waybill->getAll($branchId);
        } else {
            $waybills = $this->waybill->getAll();
        }

        return Inertia::render('sales/waybill/index', [
            'waybills' => $waybills,
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

        return Inertia::render('sales/waybill/create', [
            'code' => TransactionCode::generateTransactionCode('Waybill'),
            'salesOrders' => $this->salesOrder->getByBranchId($request->user()->branch_id),
        ]);
    }

    public function store(WaybillRequest $request)
    {
        try {
            $this->waybill->store($request->validated());
            return redirect()
                ->route('sales.waybill.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Waybill Created',
                        'description' => 'Waybill has been created successfully.'
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
                        'title' => 'Error Creating Waybill',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function show($id)
    {
        return Inertia::render('sales/waybill/show', [
            'waybill' => $this->waybill->getById($id),
        ]);
    }

    public function generatePdf($id)
    {
        $waybill = $this->waybill->getById($id);

        $pdf = PDF::loadView('pdf.waybill', [
            'waybill' => $waybill
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'sans-serif'
        ]);

        return $pdf->stream($waybill->code . '.pdf');
    }

    public function getSalesOrderData(Request $request)
    {
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            $data = $this->waybill->getSalesOrderWaybillDetails($request->query('sales_order_id'));
            return response()->json($data);
        }
    }
}
