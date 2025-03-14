<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UserRequest;
use App\Interface\BranchInterface;
use App\Interface\RoleInterface;
use App\Interface\UserInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(private UserInterface $user, private BranchInterface $branch, private RoleInterface $role) {}

    public function index()
    {
        return Inertia::render('settings/user/index', [
            'users' => $this->user->getAll()
        ]);
    }

    public function create()
    {
        return Inertia::render('settings/user/create', [
            'roles' => $this->role->getAll(),
            'branches' => $this->branch->getAll()
        ]);
    }

    public function store(UserRequest $request)
    {
        try {
            $this->user->store($request->validated());
            return redirect()
                ->route('users.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'User Created',
                        'description' => 'User has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the user. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating User',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function edit($id)
    {
        $user = $this->user->getById($id);

        if (!$user) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'User Not Found',
                'customDescription' => 'The user you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Users',
                        'href' => route('users.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('users.edit', $id)
                    ],
                    [
                        'title' => 'User Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('settings/user/edit', [
            'user' => $user,
            'roles' => $this->role->getAll(),
            'branches' => $this->branch->getAll()
        ]);
    }

    public function update(UserRequest $request, $id)
    {
        try {
            $this->user->update($id, $request->validated());
            return redirect()
                ->route('users.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'User Updated',
                        'description' => 'User has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the user. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating User',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->user->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'User Deleted',
                    'description' => 'User has been deleted successfully.'
                ]
            ]);
    }

    public function resetPassword($id)
    {
        $this->user->resetPassword($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Password Reset',
                    'description' => 'Password has been reset successfully.'
                ]
            ]);
    }
}
