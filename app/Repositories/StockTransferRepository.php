<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\StockTransferInterface;
use App\Models\Branch;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class StockTransferRepository implements StockTransferInterface
{
    const GENERAL_RELATIONSHIPS = [
        'source_able:id,name', 'destination_able:id,name', 'user:id,name'
    ];

    const sourceAbleTypeMap = ['branch' => Branch::class, 'warehouse' => Warehouse::class];

    public function __construct(private StockTransfer $stockTransfer) {}

    public function getAll($filter)
    {
        $query = $this->stockTransfer
            ->with(self::GENERAL_RELATIONSHIPS)
            ->orderByDesc('code');

        if (!empty($filter['search'])) {
            $searchTerm = strtolower($filter['search']);
            $query->where(function ($query) use ($searchTerm) {
                $query->whereRaw("LOWER(code) LIKE '%{$searchTerm}%'")
                    ->orWhereHas('user', function($q) use ($searchTerm) {
                        $q->whereRaw("LOWER(name) LIKE '%{$searchTerm}%'");
                    });
            });
        }

        return $query->paginate(10)->withQueryString();
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
                'source_able_id' => $data['source_able_id'],
                'source_able_type' => self::sourceAbleTypeMap[$data['source_able_type']],
                'destination_able_id' => $data['destination_able_id'],
                'destination_able_type' => self::sourceAbleTypeMap[$data['destination_able_type']],
                'user_id' => request()->user()->id,
            ]);

            foreach ($data['stock_transfer_details'] as $stockTransferDetail) {
                $transfer =  $stockTransfer->stockTransferDetails()->create([
                    'item_id' => $stockTransferDetail['item_id'],
                    'quantity' => $stockTransferDetail['quantity'],
                    'source_before_quantity' => $stockTransferDetail['source_before_quantity'],
                    'source_after_quantity' => $stockTransferDetail['source_after_quantity'],
                    'destination_before_quantity' => $stockTransferDetail['destination_before_quantity'],
                    'destination_after_quantity' => $stockTransferDetail['destination_after_quantity'],
                ]);

                app(ItemRepository::class)->transferBatch($transfer->item_id, $data['source_able_id'] ,self::sourceAbleTypeMap[$data['source_able_type']], $data['destination_able_id'], self::sourceAbleTypeMap[$data['destination_able_type']], $transfer->quantity, $transfer);
            }

            TransactionCode::confirmTransactionCode('Stock Transfer', $data['code']);
        });
    }
}
