import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Shield, ClipboardCheck, FileCheck } from 'lucide-react'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to AssurKit - Your SOX Compliance Platform</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <CardDescription>No risks identified</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Controls</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <CardDescription>No controls configured</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <CardDescription>All tests complete</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence Files</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <CardDescription>No evidence uploaded</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to set up your SOX compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                <span className="text-sm">Create your company profile</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                <span className="text-sm">Define business processes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                <span className="text-sm">Identify risks and controls</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                <span className="text-sm">Schedule and execute tests</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your compliance program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              No recent activity
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}