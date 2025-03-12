<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TaxRateRequest;
use App\Interface\TaxRateInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxRateController extends Controller
{
    public function __construct(private TaxRateInterface $taxRate) {}

    public function index()
    {
        $editingId = request()->query('id');
        $editingTaxRate = $editingId ? $this->taxRate->getById($editingId) : null;

        return Inertia::render('settings/tax-rate/index', [
            'taxRates' => $this->taxRate->getAll(),
            'editingTaxRate' => $editingTaxRate,
        ]);
    }

    public function store(TaxRateRequest $request)
    {
        try {
            $this->taxRate->store($request->validated());
            return redirect()
                ->route('tax-rates.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Tax Rate Created',
                        'description' => 'Tax rate has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the tax rate. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Tax Rate',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(TaxRateRequest $request, $id)
    {
        try {
            $this->taxRate->update($id, $request->validated());
            return redirect()
                ->route('tax-rates.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Tax Rate Updated',
                        'description' => 'Tax rate has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the tax rate. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Tax Rate',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->taxRate->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Tax Rate Deleted',
                    'description' => 'Tax rate has been deleted successfully.'
                ]
            ]);
    }
}
