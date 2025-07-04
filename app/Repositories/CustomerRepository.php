<?php

namespace App\Repositories;

use App\Interface\CustomerInterface;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class CustomerRepository implements CustomerInterface
{
    public function __construct(private Customer $customer) {}

    public function getAll($filter)
    {
        $query = $this->customer
            ->withCount(['salesInvoices as unpaid_invoices_count' => function ($query) {
                $query->where('paid_status', '!=', 'paid');
            }])
            ->addSelect(['total_receivable' => function ($query) {
                $query->selectRaw('COALESCE(SUM(remaining_amount), 0)')
                    ->from('sales_invoices')
                    ->whereColumn('customer_id', 'customers.id')
                    ->where('paid_status', '!=', 'paid');
            }])
            ->orderBy('id');

        if (!empty($filter['search'])) {
            $searchTerm = strtolower($filter['search']);
            $query->where(function ($query) use ($searchTerm) {
                $query->whereRaw("LOWER(name) LIKE '%{$searchTerm}%'");
            });
        }

        return $query->paginate(10)->withQueryString();
    }

    public function getAllNoPaginate()
    {
        return $this->customer->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->customer->find($id);
    }

    public function getCustomerPricesById(int $id)
    {
        $customer = $this->customer->with('customerPrices')->find($id);

        return $customer->customerPrices->toArray();
    }

    public function editById(int $id)
    {
        return $this->customer->with('customerPrices')->find($id);
    }

    public function showById(int $id)
    {
        $customer = $this->getById($id);

        $customerPrices = $customer->customerPrices()
            ->with('item')
            ->paginate(10);

        $customer->setRelation('customerPrices', $customerPrices);

        return $customer;
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $customer = $this->customer->create([
                'name' => $data['name'],
                'contact_name' => $data['contact_name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
            ]);

            if (!empty($data['customer_prices'])) {
                foreach ($data['customer_prices'] as $customer_price) {
                    $customer->customerPrices()->create([
                        'item_id' => $customer_price['item_id'],
                        'price' => $customer_price['price'],
                    ]);
                }
            }

        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $customer = $this->getById($id);
            $customer->update([
                'name' => $data['name'],
                'contact_name' => $data['contact_name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
            ]);

            if (isset($data['customer_prices'])) {
                $existingIds = collect($data['customer_prices'])
                    ->filter(fn($item) => !empty($item['id']))
                    ->pluck('id')
                    ->toArray();

                $customer->customerPrices()->whereNotIn('id', $existingIds)->delete();

                foreach ($data['customer_prices'] as $customer_price) {
                    if (!empty($customer_price['id'])) {
                        $customer->customerPrices()->find($customer_price['id'])->update([
                            'item_id' => $customer_price['item_id'],
                            'price' => $customer_price['price'],
                        ]);
                    } else {
                        $customer->customerPrices()->create([
                            'item_id' => $customer_price['item_id'],
                            'price' => $customer_price['price'],
                        ]);
                    }
                }
            } else {
                $customer->customerPrices()->delete();
            }
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $customer = $this->getById($id);
            $customer->customerPrices()->delete();
            $customer->delete();
        });
    }
}
