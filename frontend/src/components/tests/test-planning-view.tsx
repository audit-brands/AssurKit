import { useState } from 'react'
import { useTestPlans, useCreateTestPlan, useUpdateTestPlan, useDeleteTestPlan, type TestPlan } from '@/hooks/use-tests'
import { useControls } from '@/hooks/use-controls'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Edit,
  Trash2,
  FileText,
  Calendar,
  User,
  Filter
} from 'lucide-react'

interface TestPlanningViewProps {
  showNewDialog: boolean
  onCloseNewDialog: () => void
}

interface TestPlanFormData {
  control_id: string
  test_name: string
  test_description: string
  testing_procedures: string
  sample_size: number
  sample_selection_method: 'Random' | 'Risk-based' | 'Judgmental' | 'Complete'
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc'
  testing_approach: 'Inquiry' | 'Observation' | 'Inspection' | 'Reperformance' | 'Analytical'
  expected_results: string
  population_size?: number
  testing_period_start: string
  testing_period_end: string
  assigned_tester: string
  reviewer: string
}

export function TestPlanningView({ showNewDialog, onCloseNewDialog }: TestPlanningViewProps) {
  const [selectedControlId, setSelectedControlId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null)
  const [formData, setFormData] = useState<TestPlanFormData>({
    control_id: '',
    test_name: '',
    test_description: '',
    testing_procedures: '',
    sample_size: 1,
    sample_selection_method: 'Random',
    frequency: 'Quarterly',
    testing_approach: 'Inspection',
    expected_results: '',
    testing_period_start: '',
    testing_period_end: '',
    assigned_tester: '',
    reviewer: ''
  })

  const { data: testPlans, isLoading } = useTestPlans(selectedControlId)
  const { data: controlsData } = useControls({ limit: 100 })
  const controls = controlsData?.items ?? []
  const createTestPlan = useCreateTestPlan()
  const updateTestPlan = useUpdateTestPlan()
  const deleteTestPlan = useDeleteTestPlan()

  const filteredTestPlans = testPlans?.filter(plan =>
    statusFilter === 'all' || plan.status.toLowerCase() === statusFilter
  ) || []

  const handleSubmit = async () => {
    if (editingPlan) {
      await updateTestPlan.mutateAsync({
        id: editingPlan,
        ...formData
      })
      setEditingPlan(null)
    } else {
      await createTestPlan.mutateAsync({ ...formData, status: 'Draft' })
      onCloseNewDialog()
    }
    resetForm()
  }

  const handleEdit = (plan: TestPlan) => {
    setFormData({
      control_id: plan.control_id,
      test_name: plan.test_name,
      test_description: plan.test_description,
      testing_procedures: plan.testing_procedures,
      sample_size: plan.sample_size,
      sample_selection_method: plan.sample_selection_method,
      frequency: plan.frequency,
      testing_approach: plan.testing_approach,
      expected_results: plan.expected_results,
      population_size: plan.population_size,
      testing_period_start: plan.testing_period_start,
      testing_period_end: plan.testing_period_end,
      assigned_tester: plan.assigned_tester,
      reviewer: plan.reviewer
    })
    setEditingPlan(plan.id)
  }

  const handleDelete = async (id: string) => {
    await deleteTestPlan.mutateAsync(id)
    setDeletingPlan(null)
  }

  const resetForm = () => {
    setFormData({
      control_id: '',
      test_name: '',
      test_description: '',
      testing_procedures: '',
      sample_size: 1,
      sample_selection_method: 'Random',
      frequency: 'Quarterly',
      testing_approach: 'Inspection',
      expected_results: '',
      testing_period_start: '',
      testing_period_end: '',
      assigned_tester: '',
      reviewer: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'under review':
        return 'bg-orange-100 text-orange-800'
      case 'concluded':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="control-filter">Filter by Control</Label>
            <Select value={selectedControlId} onValueChange={setSelectedControlId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Controls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Controls</SelectItem>
                {controls?.map(control => (
                  <SelectItem key={control.id} value={control.id}>
                    {control.control_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="concluded">Concluded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Plans</CardTitle>
          <CardDescription>
            Manage and monitor test plans for control testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Control</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Assigned Tester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No test plans found. Create your first test plan to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTestPlans.map(plan => {
                    const control = controls?.find(c => c.id === plan.control_id)
                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{plan.test_name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {plan.test_description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {control?.control_name || 'Unknown Control'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{plan.frequency}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {plan.assigned_tester}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(plan.status)}>
                            {plan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(plan.testing_period_start).toLocaleDateString()} -
                            {new Date(plan.testing_period_end).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(plan)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingPlan(plan.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New/Edit Test Plan Dialog */}
      <Dialog open={showNewDialog || !!editingPlan} onOpenChange={(open) => {
        if (!open) {
          onCloseNewDialog()
          setEditingPlan(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Test Plan' : 'Create New Test Plan'}
            </DialogTitle>
            <DialogDescription>
              Define the testing approach and procedures for control validation.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="control_id">Control *</Label>
                <Select
                  value={formData.control_id}
                  onValueChange={(value) => setFormData({ ...formData, control_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a control" />
                  </SelectTrigger>
                  <SelectContent>
                    {controls?.map(control => (
                      <SelectItem key={control.id} value={control.id}>
                        {control.control_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="test_name">Test Name *</Label>
                <Input
                  id="test_name"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  placeholder="Enter test name"
                />
              </div>

              <div>
                <Label htmlFor="test_description">Test Description *</Label>
                <Textarea
                  id="test_description"
                  value={formData.test_description}
                  onChange={(e) => setFormData({ ...formData, test_description: e.target.value })}
                  placeholder="Describe the test objective and scope"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="testing_procedures">Testing Procedures *</Label>
                <Textarea
                  id="testing_procedures"
                  value={formData.testing_procedures}
                  onChange={(e) => setFormData({ ...formData, testing_procedures: e.target.value })}
                  placeholder="Step-by-step testing procedures"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="expected_results">Expected Results *</Label>
                <Textarea
                  id="expected_results"
                  value={formData.expected_results}
                  onChange={(e) => setFormData({ ...formData, expected_results: e.target.value })}
                  placeholder="What results indicate the control is operating effectively?"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: TestPlanFormData['frequency']) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Ad-hoc">Ad-hoc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="testing_approach">Testing Approach *</Label>
                  <Select
                    value={formData.testing_approach}
                    onValueChange={(value: TestPlanFormData['testing_approach']) => setFormData({ ...formData, testing_approach: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inquiry">Inquiry</SelectItem>
                      <SelectItem value="Observation">Observation</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                      <SelectItem value="Reperformance">Reperformance</SelectItem>
                      <SelectItem value="Analytical">Analytical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sample_size">Sample Size *</Label>
                  <Input
                    id="sample_size"
                    type="number"
                    min="1"
                    value={formData.sample_size}
                    onChange={(e) => setFormData({ ...formData, sample_size: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <Label htmlFor="population_size">Population Size</Label>
                  <Input
                    id="population_size"
                    type="number"
                    value={formData.population_size || ''}
                    onChange={(e) => setFormData({ ...formData, population_size: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sample_selection_method">Sample Selection Method *</Label>
                <Select
                  value={formData.sample_selection_method}
                  onValueChange={(value: TestPlanFormData['sample_selection_method']) => setFormData({ ...formData, sample_selection_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Random">Random</SelectItem>
                    <SelectItem value="Risk-based">Risk-based</SelectItem>
                    <SelectItem value="Judgmental">Judgmental</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testing_period_start">Testing Period Start *</Label>
                  <Input
                    id="testing_period_start"
                    type="date"
                    value={formData.testing_period_start}
                    onChange={(e) => setFormData({ ...formData, testing_period_start: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="testing_period_end">Testing Period End *</Label>
                  <Input
                    id="testing_period_end"
                    type="date"
                    value={formData.testing_period_end}
                    onChange={(e) => setFormData({ ...formData, testing_period_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assigned_tester">Assigned Tester *</Label>
                  <Input
                    id="assigned_tester"
                    value={formData.assigned_tester}
                    onChange={(e) => setFormData({ ...formData, assigned_tester: e.target.value })}
                    placeholder="Enter tester name"
                  />
                </div>

                <div>
                  <Label htmlFor="reviewer">Reviewer *</Label>
                  <Input
                    id="reviewer"
                    value={formData.reviewer}
                    onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
                    placeholder="Enter reviewer name"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onCloseNewDialog()
                setEditingPlan(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.control_id || !formData.test_name || !formData.test_description}
            >
              {editingPlan ? 'Update Test Plan' : 'Create Test Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test plan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlan && handleDelete(deletingPlan)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
