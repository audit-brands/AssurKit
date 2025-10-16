# Role-Based Access Control (RBAC) Documentation

## Overview

AssurKit implements comprehensive RBAC enforcement at the API level using JWT authentication and role-based middleware. All protected routes require a valid JWT token, and many routes also require specific roles.

## Roles

### Role Hierarchy

1. **Admin** - Full system access
   - User management
   - All Manager + Tester + Viewer permissions

2. **Manager** - Can manage tests and assignments
   - Create/update/delete companies, processes, risks, controls
   - Manage tests and evidence
   - All Tester + Viewer permissions

3. **Tester** - Can perform tests and upload evidence
   - Read access to all resources
   - Can submit test results
   - Can upload evidence

4. **Viewer** - Read-only access
   - Can view all companies, processes, risks, controls, tests
   - Cannot create, update, or delete any resources

### Default Role

New users registered via `/auth/register` are automatically assigned the **Viewer** role.

## Authentication

### JWT Token Structure

```json
{
  "iat": 1234567890,
  "exp": 1234571490,
  "user_id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "roles": ["Admin", "Manager"]
}
```

### Token Expiration

- **Duration**: 1 hour (3600 seconds)
- **Refresh**: Use `/auth/refresh` endpoint with current token to get new token
- **Expired tokens**: Return 401 Unauthorized

### Authorization Header

All protected routes require the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Route Protection Levels

### Public Routes (No Authentication Required)

```
GET  /                       # API info
GET  /health                 # Health check
POST /auth/login            # User login
POST /auth/register         # User registration
POST /auth/refresh          # Token refresh
```

### Protected Routes (All Authenticated Users)

```
GET /api/me                          # Current user profile

# Read-only operations
GET /api/companies                   # List companies
GET /api/companies/{id}             # Get company details
GET /api/processes                   # List processes
GET /api/processes/{id}             # Get process details
GET /api/subprocesses               # List subprocesses
GET /api/subprocesses/{id}          # Get subprocess details
GET /api/risks                       # List risks
GET /api/risks/{id}                 # Get risk details
GET /api/controls                    # List controls
GET /api/controls/{id}              # Get control details
GET /api/risk-control-matrix        # View RCM
GET /api/risk-control-matrix/effectiveness-report  # RCM report
GET /api/tests                       # List tests
GET /api/tests/{id}                 # Get test details
GET /api/tests/dashboard            # Testing dashboard
GET /api/evidence                    # List evidence
GET /api/evidence/{id}              # Get evidence details
GET /api/evidence/{id}/download     # Download evidence file
```

### Manager/Admin Routes (Requires Manager OR Admin Role)

```
# Company management
POST   /api/manage/companies                     # Create company
PUT    /api/manage/companies/{id}               # Update company
DELETE /api/manage/companies/{id}               # Delete company

# Process management
POST   /api/manage/processes                     # Create process
PUT    /api/manage/processes/{id}               # Update process
DELETE /api/manage/processes/{id}               # Delete process

# Subprocess management
POST   /api/manage/subprocesses                  # Create subprocess
PUT    /api/manage/subprocesses/{id}            # Update subprocess
DELETE /api/manage/subprocesses/{id}            # Delete subprocess

# Risk management
POST   /api/manage/risks                         # Create risk
PUT    /api/manage/risks/{id}                   # Update risk
DELETE /api/manage/risks/{id}                   # Delete risk

# Control management
POST   /api/manage/controls                      # Create control
PUT    /api/manage/controls/{id}                # Update control
DELETE /api/manage/controls/{id}                # Delete control

# Risk-Control Matrix management
POST   /api/manage/risk-control-matrix/assign   # Assign control to risk
PUT    /api/manage/risk-control-matrix/update   # Update RCM assignment
DELETE /api/manage/risk-control-matrix/remove   # Remove RCM assignment

# Test management
POST   /api/manage/tests                         # Create test
PUT    /api/manage/tests/{id}                   # Update test
DELETE /api/manage/tests/{id}                   # Delete test

# Evidence management
POST   /api/manage/evidence/upload              # Upload evidence
PUT    /api/manage/evidence/{id}/metadata       # Update evidence metadata
POST   /api/manage/evidence/{id}/archive        # Archive evidence
```

### Admin-Only Routes (Requires Admin Role)

```
GET    /api/admin/users          # List all users
GET    /api/admin/users/{id}     # Get user details
POST   /api/admin/users          # Create user
PUT    /api/admin/users/{id}     # Update user
DELETE /api/admin/users/{id}     # Delete user
```

## Error Responses

### 401 Unauthorized

Returned when:
- No Authorization header is provided
- Token is missing the "Bearer " prefix
- Token is invalid or malformed
- Token has expired
- Token signature is invalid

```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

### 403 Forbidden

Returned when:
- User is authenticated but lacks required role
- User attribute is not set on request (auth middleware not run)

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions. Required roles: Admin, Manager"
}
```

## Implementation Details

### Middleware Stack

1. **CORS Middleware** - Handles cross-origin requests
2. **AuthMiddleware** - Validates JWT token, attaches user to request
3. **RoleMiddleware** - Checks user has required role(s)

### Route Group Structure

```php
// All routes in /api group require authentication
$app->group('/api', function ($group) {
    // All authenticated users can access these
    $group->get('/companies', ...);

    // Manager/Admin required
    $group->group('/manage', function ($manageGroup) {
        $manageGroup->post('/companies', ...);
    })->add(new RoleMiddleware(['Manager', 'Admin']));

    // Admin only
    $group->group('/admin', function ($adminGroup) {
        $adminGroup->get('/users', ...);
    })->add(new RoleMiddleware(['Admin']));

})->add($authMiddleware);
```

## Usage Examples

### Login and Access Protected Route

```bash
# 1. Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response:
# {
#   "message": "Login successful",
#   "token": "eyJhbGci...",
#   "user": {"id": "...", "email": "...", "roles": ["Viewer"]}
# }

# 2. Access protected route
curl -X GET http://localhost:8080/api/companies \
  -H "Authorization: Bearer eyJhbGci..."
```

### Create Resource (Manager/Admin Required)

```bash
# Requires Manager or Admin role
curl -X POST http://localhost:8080/api/manage/companies \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"name":"New Company","industry":"Technology"}'
```

### User Management (Admin Required)

```bash
# Requires Admin role
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer eyJhbGci..."
```

## Testing

### Unit Tests

- `tests/Unit/AuthMiddlewareTest.php` - JWT validation, token handling
- `tests/Unit/RoleMiddlewareTest.php` - Role checking logic

### Integration Tests

- `tests/Feature/Middleware/RBACIntegrationTest.php` - Full middleware stack testing

### Running Tests

```bash
cd api
vendor/bin/pest tests/Unit/AuthMiddlewareTest.php
vendor/bin/pest tests/Unit/RoleMiddlewareTest.php
vendor/bin/pest tests/Feature/Middleware/RBACIntegrationTest.php
```

## Security Considerations

1. **Token Secret**: Ensure `JWT_SECRET` environment variable is set to a strong, random value in production
2. **HTTPS Only**: Always use HTTPS in production to prevent token interception
3. **Token Expiration**: Tokens expire after 1 hour; clients should handle 401 responses and refresh tokens
4. **Role Assignment**: Only Admins can assign roles via user management endpoints
5. **Default Role**: New registrations get Viewer role by default (least privilege)
6. **Password Hashing**: Passwords are hashed using bcrypt (PASSWORD_DEFAULT)

## Future Enhancements

- [ ] Token blacklist for logout functionality
- [ ] Refresh token rotation
- [ ] Rate limiting per role
- [ ] Permission-based access control (more granular than roles)
- [ ] OAuth2/OIDC integration
- [ ] Multi-factor authentication (MFA)
