import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Key,
  Lock,
  CheckCircle,
  AlertTriangle,
  Copy,
  Save,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  resource: string
  action: string
  created_at: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  user_count: number
  is_system: boolean
  created_at: string
  updated_at: string
}

interface RoleUser {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'active' | 'pending' | 'suspended' | 'inactive'
  assigned_at: string
}

const PERMISSION_CATEGORIES = [
  'users', 'roles', 'controls', 'tests', 'evidence', 'issues', 'reports', 'admin', 'audit'
]

const PERMISSION_ACTIONS = [
  'create', 'read', 'update', 'delete', 'assign', 'approve', 'export', 'configure'
]

export function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async (): Promise<Role[]> => {
      const response = await fetch('/api/admin/roles')
      if (!response.ok) throw new Error('Failed to fetch roles')
      return response.json()
    }
  })

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async (): Promise<Permission[]> => {
      const response = await fetch('/api/admin/permissions')
      if (!response.ok) throw new Error('Failed to fetch permissions')
      return response.json()
    }
  })

  const { data: roleUsers = [] } = useQuery({
    queryKey: ['role-users', selectedRole?.id],
    queryFn: async (): Promise<RoleUser[]> => {
      if (!selectedRole?.id) return []
      const response = await fetch(`/api/admin/roles/${selectedRole.id}/users`)
      if (!response.ok) throw new Error('Failed to fetch role users')
      return response.json()
    },
    enabled: !!selectedRole?.id
  })

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; description: string; permissions: string[] }) => {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
      })
      if (!response.ok) throw new Error('Failed to create role')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      setIsCreateRoleOpen(false)
      toast({ title: 'Role created successfully' })
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: { id: string; name: string; description: string; permissions: string[] }) => {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData)
      })
      if (!response.ok) throw new Error('Failed to update role')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      setIsEditRoleOpen(false)
      setSelectedRole(null)
      toast({ title: 'Role updated successfully' })
    }
  })

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete role')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      toast({ title: 'Role deleted successfully' })
    }
  })

  const createPermissionMutation = useMutation({
    mutationFn: async (permissionData: { name: string; description: string; category: string; resource: string; action: string }) => {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData)
      })
      if (!response.ok) throw new Error('Failed to create permission')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] })
      setIsCreatePermissionOpen(false)
      toast({ title: 'Permission created successfully' })
    }
  })

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions for the system
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="assignment">Role Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <h2 className="text-xl font-semibold">System Roles</h2>
            </div>
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <CreateRoleDialog
                groupedPermissions={groupedPermissions}
                onSubmit={(data) => createRoleMutation.mutate(data)}
                isLoading={createRoleMutation.isPending}
              />
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRole(role)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {role.is_system && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedRole(role)
                            setIsEditRoleOpen(true)
                          }} disabled={role.is_system}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(role.id)
                            toast({ title: 'Role ID copied to clipboard' })
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteRoleMutation.mutate(role.id)}
                            disabled={role.is_system || role.user_count > 0}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {role.user_count} users
                    </span>
                    <span className="flex items-center">
                      <Key className="h-4 w-4 mr-1" />
                      {role.permissions.length} permissions
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedRole && (
            <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
              <EditRoleDialog
                role={selectedRole}
                groupedPermissions={groupedPermissions}
                onSubmit={(data) => updateRoleMutation.mutate({ id: selectedRole.id, ...data })}
                isLoading={updateRoleMutation.isPending}
              />
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <h2 className="text-xl font-semibold">System Permissions</h2>
            </div>
            <Dialog open={isCreatePermissionOpen} onOpenChange={setIsCreatePermissionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Permission
                </Button>
              </DialogTrigger>
              <CreatePermissionDialog
                onSubmit={(data) => createPermissionMutation.mutate(data)}
                isLoading={createPermissionMutation.isPending}
              />
            </Dialog>
          </div>

          <div className="flex space-x-4">
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {PERMISSION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.category}</Badge>
                    </TableCell>
                    <TableCell>{permission.resource}</TableCell>
                    <TableCell>{permission.action}</TableCell>
                    <TableCell>{new Date(permission.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Role Assignment</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Role</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72">
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className={`p-3 rounded-lg cursor-pointer border ${
                          selectedRole?.id === role.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => setSelectedRole(role)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{role.name}</span>
                          <Badge variant="secondary">{role.user_count}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedRole ? `Users with ${selectedRole.name} Role` : 'Select a role to view users'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRole ? (
                  <ScrollArea className="h-72">
                    <div className="space-y-3">
                      {roleUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Assigned: {new Date(user.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              user.status === 'active' ? 'default' :
                              user.status === 'pending' ? 'secondary' :
                              user.status === 'suspended' ? 'destructive' : 'outline'
                            }>
                              {user.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {user.status === 'suspended' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {roleUsers.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No users assigned to this role
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Select a role from the left to view assigned users
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface CreateRoleDialogProps {
  groupedPermissions: Record<string, Permission[]>
  onSubmit: (data: { name: string; description: string; permissions: string[] }) => void
  isLoading: boolean
}

function CreateRoleDialog({ groupedPermissions, onSubmit, isLoading }: CreateRoleDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description, permissions: selectedPermissions })
    setName('')
    setDescription('')
    setSelectedPermissions([])
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const toggleCategory = (category: string) => {
    const categoryPermissions = groupedPermissions[category]?.map(p => p.id) || []
    const allSelected = categoryPermissions.every(id => selectedPermissions.includes(id))

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissions.includes(id)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])])
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogDescription>
          Create a new role and assign permissions to it.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions ({selectedPermissions.length} selected)</Label>
            <ScrollArea className="h-64 border rounded-md p-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      checked={categoryPermissions.every(p => selectedPermissions.includes(p.id))}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Label className="font-medium capitalize">{category}</Label>
                  </div>
                  <div className="ml-6 space-y-1">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label className="text-sm">{permission.name}</Label>
                        <span className="text-xs text-muted-foreground">({permission.description})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Create Role
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

interface EditRoleDialogProps {
  role: Role
  groupedPermissions: Record<string, Permission[]>
  onSubmit: (data: { name: string; description: string; permissions: string[] }) => void
  isLoading: boolean
}

function EditRoleDialog({ role, groupedPermissions, onSubmit, isLoading }: EditRoleDialogProps) {
  const [name, setName] = useState(role.name)
  const [description, setDescription] = useState(role.description)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description, permissions: selectedPermissions })
  }

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const toggleCategory = (category: string) => {
    const categoryPermissions = groupedPermissions[category]?.map(p => p.id) || []
    const allSelected = categoryPermissions.every(id => selectedPermissions.includes(id))

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissions.includes(id)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])])
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>Edit Role: {role.name}</DialogTitle>
        <DialogDescription>
          Modify the role details and permissions.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role.is_system}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={role.is_system}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions ({selectedPermissions.length} selected)</Label>
            <ScrollArea className="h-64 border rounded-md p-4">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      checked={categoryPermissions.every(p => selectedPermissions.includes(p.id))}
                      onCheckedChange={() => toggleCategory(category)}
                      disabled={role.is_system}
                    />
                    <Label className="font-medium capitalize">{category}</Label>
                  </div>
                  <div className="ml-6 space-y-1">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                          disabled={role.is_system}
                        />
                        <Label className="text-sm">{permission.name}</Label>
                        <span className="text-xs text-muted-foreground">({permission.description})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading || role.is_system}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Update Role
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

interface CreatePermissionDialogProps {
  onSubmit: (data: { name: string; description: string; category: string; resource: string; action: string }) => void
  isLoading: boolean
}

function CreatePermissionDialog({ onSubmit, isLoading }: CreatePermissionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [resource, setResource] = useState('')
  const [action, setAction] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description, category, resource, action })
    setName('')
    setDescription('')
    setCategory('')
    setResource('')
    setAction('')
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Permission</DialogTitle>
        <DialogDescription>
          Create a new permission for the system.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., users.create"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this permission allows"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={setAction} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_ACTIONS.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act.charAt(0).toUpperCase() + act.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource">Resource</Label>
            <Input
              id="resource"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              placeholder="e.g., user, control, test"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Create Permission
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}