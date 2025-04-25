<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TransactionPrefixRequest;
use App\Interface\TransactionPrefixInterface;
use Inertia\Inertia;

class TransactionPrefixController extends Controller
{
    public function __construct(private TransactionPrefixInterface $transactionPrefix) {}

    public function index()
    {
        return Inertia::render('settings/transaction-prefix/index', [
            'transactionPrefixes' => $this->transactionPrefix->getAll(),
        ]);
    }

    public function update(TransactionPrefixRequest $request)
    {
        try {
            $this->transactionPrefix->update($request->validated());
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Transaction Prefix Updated',
                        'description' => 'Transaction prefix has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the transaction prefix. Please try again later.'
                : $th->getMessage();
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Transaction Prefix',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }
}
