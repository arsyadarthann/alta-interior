<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\StockTransferInterface;
use App\Models\StockTransfer;
use Illuminate\Support\Facades\DB;

class StockTransferRepository implements StockTransferInterface
{
    const GENERAL_RELATIONSHIPS = [
        'fromBranch:id,name', 'toBranch:id,name', 'user:id,name'
    ];

    public function __construct(private StockTransfer $stockTransfer) {}

    public function getAll()
    {
        return $this->stockTransfer
            ->with(self::GENERAL_RELATIONSHIPS)
            ->orderByDesc('code')->get();
    }

    public function getById(int $id)
    {
        return $this->stockTransfer
            ->with([...self::GENERAL_RELATIONSHIPS, 'stockTransferDetails.item.itemUnit'])
            ->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $stockTransfer = $this->stockTransfer->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'from_branch_id' => $data['from_branch_id'],
                'to_branch_id' => $data['to_branch_id'],
                'user_id' => request()->user()->id,
            ]);

            foreach ($data['stock_transfer_details'] as $stockTransferDetail) {
                $transfer =  $stockTransfer->stockTransferDetails()->create([
                    'item_id' => $stockTransferDetail['item_id'],
                    'quantity' => $stockTransferDetail['quantity'],
                    'from_branch_before_quantity' => $stockTransferDetail['from_branch_before_quantity'],
                    'from_branch_after_quantity' => $stockTransferDetail['from_branch_after_quantity'],
                    'to_branch_before_quantity' => $stockTransferDetail['to_branch_before_quantity'],
                    'to_branch_after_quantity' => $stockTransferDetail['to_branch_after_quantity'],
                ]);

                app(ItemRepository::class)->transferBatch($transfer->item_id, $data['from_branch_id'], $data['to_branch_id'], $transfer->quantity, $transfer);
            }

            TransactionCode::confirmTransactionCode('Stock Transfer', $data['code']);
        });
    }
}
