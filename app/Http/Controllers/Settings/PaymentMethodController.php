<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PaymentMethodRequest;
use App\Interface\PaymentMethodInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentMethodController extends Controller
{
    public function __construct(private PaymentMethodInterface $paymentMethod) {}

    public function index()
    {
        return Inertia::render('settings/payment-method/index', [
            'paymentMethods' => $this->paymentMethod->getAll(),
        ]);
    }

    public function store(PaymentMethodRequest $request)
    {
        try {
            $this->paymentMethod->store($request->validated());
            return redirect()
                ->route('payment-methods.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Payment Method Created',
                        'description' => 'Payment method has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the payment method. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Payment Method',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(PaymentMethodRequest $request, $id)
    {
        try {
            $this->paymentMethod->update($id, $request->validated());
            return redirect()
                ->route('payment-methods.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Payment Method Updated',
                        'description' => 'Payment method has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the payment method. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Payment Method',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->paymentMethod->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Payment Method Deleted',
                    'description' => 'Payment method has been deleted successfully.'
                ]
            ]);
    }
}
