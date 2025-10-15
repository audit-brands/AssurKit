import { useState } from 'react'
import { useIssue, useIssueComments, useIssueActivity, useAddIssueComment, useResolveIssue, useReopenIssue, type Issue, getIssueSeverityColor, getIssueStatusColor, getIssueTypeColor, isIssueOverdue } from '@/hooks/use-issues'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertTriangle,
  Calendar,
  User,
  Clock,
  MessageSquare,
  Activity,
  CheckCircle,
  RotateCcw,
  Send,
  Shield,
  Target,
  FileText,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IssueDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issue: Issue | null
}

export function IssueDetails({ open, onOpenChange, issue }: IssueDetailsProps) {
  const [newComment, setNewComment] = useState('')

  const { data: fullIssue } = useIssue(issue?.id || '')
  const { data: comments } = useIssueComments(issue?.id || '')
  const { data: activities } = useIssueActivity(issue?.id || '')
  const addComment = useAddIssueComment()
  const resolveIssue = useResolveIssue()
  const reopenIssue = useReopenIssue()

  const currentIssue = fullIssue || issue

  if (!currentIssue) return null

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentIssue) return

    try {
      await addComment.mutateAsync({
        issueId: currentIssue.id,
        content: newComment.trim()
      })
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleResolve = async () => {
    if (!currentIssue) return

    try {
      await resolveIssue.mutateAsync({
        id: currentIssue.id,
        actual_resolution_date: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to resolve issue:', error)
    }
  }

  const handleReopen = async () => {
    if (!currentIssue) return

    try {
      await reopenIssue.mutateAsync({
        id: currentIssue.id,
        reason: 'Reopened for further investigation'
      })
    } catch (error) {
      console.error('Failed to reopen issue:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getOverdueIndicator = () => {
    if (isIssueOverdue(currentIssue)) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Overdue</span>
        </div>
      )
    }
    return null
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'Created': return <AlertTriangle className="h-4 w-4 text-blue-600" />
      case 'Updated': return <FileText className="h-4 w-4 text-yellow-600" />
      case 'Assigned': return <User className="h-4 w-4 text-green-600" />
      case 'Resolved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'Reopened': return <RotateCcw className="h-4 w-4 text-orange-600" />
      case 'Commented': return <MessageSquare className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Issue Details
          </DialogTitle>
          <DialogDescription>
            View complete issue information and activity history
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{currentIssue.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', getIssueSeverityColor(currentIssue.severity))}>
                        {currentIssue.severity}
                      </Badge>
                      <Badge className={cn('text-xs', getIssueTypeColor(currentIssue.issue_type))}>
                        {currentIssue.issue_type}
                      </Badge>
                      <Badge className={cn('text-xs', getIssueStatusColor(currentIssue.status))}>
                        {currentIssue.status}
                      </Badge>
                      {getOverdueIndicator()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {currentIssue.status !== 'Closed' ? (
                      <Button onClick={handleResolve} size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    ) : (
                      <Button onClick={handleReopen} variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {currentIssue.description}
                    </p>
                  </div>

                  {currentIssue.root_cause && (
                    <div>
                      <h4 className="font-medium mb-2">Root Cause</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {currentIssue.root_cause}
                      </p>
                    </div>
                  )}

                  {currentIssue.business_impact && (
                    <div>
                      <h4 className="font-medium mb-2">Business Impact</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {currentIssue.business_impact}
                      </p>
                    </div>
                  )}

                  {currentIssue.remediation_plan && (
                    <div>
                      <h4 className="font-medium mb-2">Remediation Plan</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {currentIssue.remediation_plan}
                      </p>
                    </div>
                  )}

                  {currentIssue.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentIssue.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments and Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comments & Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="comments" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments ({comments?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity ({activities?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="comments" className="space-y-4">
                    {/* Add Comment */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addComment.isPending}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {addComment.isPending ? 'Adding...' : 'Add Comment'}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Comments List */}
                    <ScrollArea className="h-64">
                      <div className="space-y-4">
                        {comments?.map(comment => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{comment.author}</span>
                              <span className="text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                        {(!comments || comments.length === 0) && (
                          <p className="text-center text-muted-foreground py-8">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="activity">
                    <ScrollArea className="h-64">
                      <div className="space-y-4">
                        {activities?.map(activity => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="mt-1">
                              {getActivityIcon(activity.action)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{activity.actor}</span>
                                <span className="text-muted-foreground">{activity.action.toLowerCase()}</span>
                                <span className="text-muted-foreground">
                                  {formatDate(activity.timestamp)}
                                </span>
                              </div>
                              {activity.details && (
                                <p className="text-sm text-muted-foreground">{activity.details}</p>
                              )}
                              {activity.changes && (
                                <div className="text-xs bg-muted p-2 rounded">
                                  {Object.entries(activity.changes).map(([field, change]) => (
                                    <div key={field}>
                                      <span className="font-medium">{field}:</span>{' '}
                                      <span className="line-through text-red-600">
                                        {String(change.from)}
                                      </span>{' '}
                                      → <span className="text-green-600">{String(change.to)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!activities || activities.length === 0) && (
                          <p className="text-center text-muted-foreground py-8">
                            No activity recorded yet.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Issue Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Control ID</p>
                  <p className="text-sm font-mono">{currentIssue.control_id}</p>
                </div>

                {currentIssue.test_execution_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Test Execution</p>
                    <p className="text-sm font-mono">#{currentIssue.test_execution_id.slice(0, 8)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <p className="text-sm">{currentIssue.created_by}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <p className="text-sm">{formatDate(currentIssue.created_at)}</p>
                  </div>
                </div>

                {currentIssue.assigned_to && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <p className="text-sm">{currentIssue.assigned_to}</p>
                    </div>
                  </div>
                )}

                {currentIssue.remediation_owner && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remediation Owner</p>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <p className="text-sm">{currentIssue.remediation_owner}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentIssue.target_resolution_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Resolution</p>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <p className="text-sm">{formatDateOnly(currentIssue.target_resolution_date)}</p>
                      {isIssueOverdue(currentIssue) && (
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </div>
                )}

                {currentIssue.actual_resolution_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Actual Resolution</p>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <p className="text-sm">{formatDateOnly(currentIssue.actual_resolution_date)}</p>
                    </div>
                  </div>
                )}

                {currentIssue.retest_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Retest Date</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <p className="text-sm">{formatDateOnly(currentIssue.retest_date)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Retest Information */}
            {currentIssue.retest_required && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Retest Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Retest Required</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      <p className="text-sm">Yes</p>
                    </div>
                  </div>

                  {currentIssue.retest_result && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Retest Result</p>
                      <Badge
                        className={cn(
                          'text-xs',
                          currentIssue.retest_result === 'Pass'
                            ? 'bg-green-100 text-green-800'
                            : currentIssue.retest_result === 'Fail'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        )}
                      >
                        {currentIssue.retest_result}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}