<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\BranchRequest;
use App\Interface\BranchInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function __construct(private BranchInterface $branch) {}

    public function index()
    {
        return Inertia::render('settings/branch/index', [
            'branches' => $this->branch->getAll()
        ]);
    }

    public function create()
    {
        return Inertia::render('settings/branch/create');
    }

    public function store(BranchRequest $request)
    {
        try {
            $this->branch->store($request->validated());
            return redirect()
                ->route('branches.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Branch Created',
                        'description' => 'Branch has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the branch. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Branch',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function edit($id)
    {
        $branch = $this->branch->getById($id);

        if (!$branch) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Branch Not Found',
                'customDescription' => 'The branch you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Branch',
                        'href' => route('branches.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('branches.edit', $id)
                    ],
                    [
                        'title' => 'Branch Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('settings/branch/edit', [
            'branch' => $branch,
        ]);
    }

    public function update(BranchRequest $request, $id)
    {
        try {
            $this->branch->update($id, $request->validated());
            return redirect()
                ->route('branches.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Branch Updated',
                        'description' => 'Branch has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the branch. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Branch',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->branch->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Branch Deleted',
                    'description' => 'Branch has been deleted successfully.'
                ]
            ]);
    }
}
