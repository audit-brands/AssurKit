<?php

declare(strict_types=1);

namespace AssurKit\Controllers;

use AssurKit\Models\Role;
use AssurKit\Models\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Respect\Validation\Validator as v;

class UserController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $queryParams = $request->getQueryParams();

        $page = max(1, (int) ($queryParams['page'] ?? 1));
        $limit = min(100, max(10, (int) ($queryParams['limit'] ?? 20)));
        $search = $queryParams['search'] ?? '';
        $role = $queryParams['role'] ?? '';

        $query = User::with('roles');

        if ($search) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%");
            });
        }

        if ($role) {
            $query->whereHas('roles', function ($q) use ($role): void {
                $q->where('name', $role);
            });
        }

        $total = $query->count();
        $users = $query->skip(($page - 1) * $limit)
                      ->take($limit)
                      ->orderBy('created_at', 'desc')
                      ->get();

        $responseData = [
            'data' => $users->map(function ($user): array {
                return [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'created_at' => $user->created_at->toISOString(),
                    'updated_at' => $user->updated_at->toISOString(),
                ];
            }),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $args['id'];
        $user = User::with('roles')->find($userId);

        if (!$user) {
            return $this->errorResponse($response, ['User not found'], 404);
        }

        $responseData = [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'roles' => $user->roles->pluck('name')->toArray(),
            'created_at' => $user->created_at->toISOString(),
            'updated_at' => $user->updated_at->toISOString(),
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $data = $request->getParsedBody();

        $validation = $this->validateUserData($data, true);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        if (User::where('email', $data['email'])->exists()) {
            return $this->errorResponse($response, ['Email already exists'], 409);
        }

        $user = User::createUser($data['email'], $data['name'], $data['password']);

        if (!empty($data['roles'])) {
            foreach ($data['roles'] as $roleName) {
                $role = Role::where('name', $roleName)->first();
                if ($role) {
                    $user->assignRole($roleName);
                }
            }
        } else {
            $user->assignRole('Viewer');
        }

        $user->load('roles');

        $responseData = [
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name')->toArray(),
                'created_at' => $user->created_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData, 201);
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $args['id'];
        $user = User::find($userId);

        if (!$user) {
            return $this->errorResponse($response, ['User not found'], 404);
        }

        $data = $request->getParsedBody();

        $validation = $this->validateUserData($data, false);
        if (!$validation['valid']) {
            return $this->errorResponse($response, $validation['errors'], 400);
        }

        if (isset($data['email']) && $data['email'] !== $user->email) {
            if (User::where('email', $data['email'])->exists()) {
                return $this->errorResponse($response, ['Email already exists'], 409);
            }
            $user->email = $data['email'];
        }

        if (isset($data['name'])) {
            $user->name = $data['name'];
        }

        if (isset($data['password'])) {
            $user->password = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $user->save();

        if (isset($data['roles'])) {
            $user->roles()->detach();
            foreach ($data['roles'] as $roleName) {
                $role = Role::where('name', $roleName)->first();
                if ($role) {
                    $user->assignRole($roleName);
                }
            }
        }

        $user->load('roles');

        $responseData = [
            'message' => 'User updated successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name')->toArray(),
                'updated_at' => $user->updated_at->toISOString(),
            ],
        ];

        return $this->jsonResponse($response, $responseData);
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $args['id'];
        $currentUser = $request->getAttribute('user');

        if ($currentUser->id === $userId) {
            return $this->errorResponse($response, ['Cannot delete your own account'], 400);
        }

        $user = User::find($userId);

        if (!$user) {
            return $this->errorResponse($response, ['User not found'], 404);
        }

        $user->delete();

        return $this->jsonResponse($response, ['message' => 'User deleted successfully']);
    }

    private function validateUserData(?array $data, bool $isCreate): array
    {
        if (!$data) {
            return ['valid' => false, 'errors' => ['No data provided']];
        }

        $errors = [];

        if ($isCreate || isset($data['email'])) {
            if (!v::email()->validate($data['email'] ?? '')) {
                $errors[] = 'Valid email is required';
            }
        }

        if ($isCreate || isset($data['name'])) {
            if (!v::stringType()->notEmpty()->length(2, 255)->validate($data['name'] ?? '')) {
                $errors[] = 'Name is required and must be between 2 and 255 characters';
            }
        }

        if ($isCreate || isset($data['password'])) {
            if ($isCreate && !v::stringType()->length(8)->validate($data['password'] ?? '')) {
                $errors[] = 'Password must be at least 8 characters long';
            } elseif (!$isCreate && isset($data['password']) && !v::stringType()->length(8)->validate($data['password'])) {
                $errors[] = 'Password must be at least 8 characters long';
            }
        }

        if (isset($data['roles'])) {
            if (!is_array($data['roles'])) {
                $errors[] = 'Roles must be an array';
            } else {
                $validRoles = Role::pluck('name')->toArray();
                foreach ($data['roles'] as $role) {
                    if (!in_array($role, $validRoles, true)) {
                        $errors[] = "Invalid role: {$role}";
                    }
                }
            }
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    private function jsonResponse(ResponseInterface $response, array $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    private function errorResponse(ResponseInterface $response, array $errors, int $status = 400): ResponseInterface
    {
        $data = [
            'error' => true,
            'message' => 'Request failed',
            'errors' => $errors,
        ];

        return $this->jsonResponse($response, $data, $status);
    }
}
