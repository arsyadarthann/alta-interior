<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\RoleRequest;
use App\Interface\PermissionInterface;
use App\Interface\RoleInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function __construct(private RoleInterface $role, private PermissionInterface $permission) {}

    public function index()
    {
        return Inertia::render('settings/role/index', [
            'roles' => $this->role->getAll()
        ]);
    }

    public function create()
    {
        return Inertia::render('settings/role/create', [
            'permissions' => $this->permission->getAll(),
        ]);
    }

    public function store(RoleRequest $request)
    {
        try {
            $this->role->store($request->validated());
            return redirect()
                ->route('roles.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Role Created',
                        'description' => 'Role has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the role. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Role',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function edit($id)
    {
        $role = $this->role->getById($id);

        if (!$role) {
            return Inertia::render('errors/error-page', [
                'status' => 404,
                'customTitle' => 'Role Not Found',
                'customDescription' => 'The role you are looking for does not exist.',
                'customBreadcrumbs' => [
                    [
                        'title' => 'Roles',
                        'href' => route('roles.index')
                    ],
                    [
                        'title' => 'Edit',
                        'href' => route('roles.edit', $id)
                    ],
                    [
                        'title' => 'Role Not Found',
                    ]
                ]
            ]);
        }

        return Inertia::render('settings/role/edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('id')
            ],
            'permissions' => $this->permission->getAll(),
        ]);
    }

    public function update(RoleRequest $request, $id)
    {
        try {
            $this->role->update($id, $request->validated());
            return redirect()
                ->route('roles.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Role Updated',
                        'description' => 'Role has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the role. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Role',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy($id)
    {
        $this->role->destroy($id);
        return redirect()
            ->back()
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Role Deleted',
                    'description' => 'Role has been deleted successfully.'
                ]
            ]);
    }
}
