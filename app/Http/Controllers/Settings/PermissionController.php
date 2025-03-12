<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PermissionRequest;
use App\Interface\PermissionInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function __construct(private PermissionInterface $permission) {}

    public function index(Request $request)
    {
        $editingId = $request->query('id');
        $editingPermission = $editingId ? $this->permission->getById($editingId) : null;

        return Inertia::render('settings/permission/index', [
            'permissions' => $this->permission->getAll(),
            'editingPermission' => $editingPermission
        ]);
    }

    public function store(PermissionRequest $request)
    {
        try {
            $this->permission->store($request->validated());
            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Permission Created',
                        'description' => 'Permission has been created successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while creating the permission. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Creating Permission',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function update(PermissionRequest $request, int $id)
    {
        try {
            $this->permission->update($id, $request->validated());
            return redirect()
                ->route('permissions.index')
                ->with('flash', [
                    'toast' => [
                        'variant' => 'success',
                        'title' => 'Permission Updated',
                        'description' => 'Permission has been updated successfully.'
                    ]
                ]);
        } catch (\Throwable $th) {
            $errorMessage = app()->environment('production')
                ? 'An error occurred while updating the permission. Please try again later.'
                : $th->getMessage();

            return redirect()
                ->back()
                ->with('flash', [
                    'toast' => [
                        'variant' => 'destructive',
                        'title' => 'Error Updating Permission',
                        'description' => $errorMessage,
                    ]
                ]);
        }
    }

    public function destroy(int $id)
    {
        $this->permission->destroy($id);
        return redirect()
            ->route('permissions.index')
            ->with('flash', [
                'toast' => [
                    'variant' => 'success',
                    'title' => 'Permission Deleted',
                    'description' => 'Permission has been deleted successfully.'
                ]
            ]);
    }
}
