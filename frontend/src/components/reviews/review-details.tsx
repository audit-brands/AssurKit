import { useState } from 'react'
import {
  useReview,
  useReviewComments,
  useApproveReview,
  useRejectReview,
  useRequestChanges,
  useAddReviewComment,
  type Review,
  type ReviewComment
} from '@/hooks/use-reviews'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Send,
  Edit3,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewDetailsProps {
  reviewId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReviewDetails({ reviewId, open, onOpenChange }: ReviewDetailsProps) {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [changesDialogOpen, setChangesDialogOpen] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionComments, setRejectionComments] = useState('')
  const [requestedChanges, setRequestedChanges] = useState('')
  const [changeComments, setChangeComments] = useState('')
  const [newComment, setNewComment] = useState('')

  const { data: review, isLoading } = useReview(reviewId || '')
  const { data: comments } = useReviewComments(reviewId || '')
  const approveReview = useApproveReview()
  const rejectReview = useRejectReview()
  const requestChanges = useRequestChanges()
  const addComment = useAddReviewComment()

  const handleApprove = async () => {
    if (!reviewId) return

    try {
      await approveReview.mutateAsync({
        reviewId,
        comments: approvalComments
      })
      setApproveDialogOpen(false)
      setApprovalComments('')
    } catch (error) {
      console.error('Failed to approve review:', error)
    }
  }

  const handleReject = async () => {
    if (!reviewId) return

    try {
      await rejectReview.mutateAsync({
        reviewId,
        reason: rejectionReason,
        comments: rejectionComments
      })
      setRejectDialogOpen(false)
      setRejectionReason('')
      setRejectionComments('')
    } catch (error) {
      console.error('Failed to reject review:', error)
    }
  }

  const handleRequestChanges = async () => {
    if (!reviewId) return

    try {
      await requestChanges.mutateAsync({
        reviewId,
        changes: requestedChanges.split('\n').filter(change => change.trim()),
        comments: changeComments
      })
      setChangesDialogOpen(false)
      setRequestedChanges('')
      setChangeComments('')
    } catch (error) {
      console.error('Failed to request changes:', error)
    }
  }

  const handleAddComment = async () => {
    if (!reviewId || !newComment.trim()) return

    try {
      await addComment.mutateAsync({
        reviewId,
        comment: newComment.trim(),
        commentType: 'general',
        isInternal: false
      })
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
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

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'in_review': return 'default'
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'changes_requested': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in_review': return <FileText className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'changes_requested': return <Edit3 className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: Review['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getCommentTypeIcon = (type: ReviewComment['comment_type']) => {
    switch (type) {
      case 'approval': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejection': return <XCircle className="h-4 w-4 text-red-600" />
      case 'change_request': return <Edit3 className="h-4 w-4 text-orange-600" />
      case 'question': return <MessageSquare className="h-4 w-4 text-blue-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const isOverdue = (review: Review) => {
    if (!review.due_date || review.completed_at) return false
    return new Date(review.due_date) < new Date()
  }

  const canUserApprove = (review: Review) => {
    // TODO: Check if current user can approve based on their role and approval chain
    return review.status === 'in_review' || review.status === 'pending'
  }

  if (!reviewId) return null

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!review) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="text-center py-8">
            <p className="text-red-600">Review not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const overdue = isOverdue(review)
  const userCanApprove = canUserApprove(review)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {review.title}
            </DialogTitle>
            <DialogDescription>
              {review.review_type} review for {review.entity_type} #{review.entity_id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Review Status and Metadata */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(review.status)}
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={getStatusColor(review.status)}>
                      {review.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <Badge variant={getPriorityColor(review.priority)}>
                      {review.priority}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Reviewer</p>
                    <p className="text-sm text-muted-foreground">
                      {review.assigned_to_user?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className={cn(
                      'text-sm',
                      overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
                    )}>
                      {review.due_date ? formatDate(review.due_date) : 'No due date'}
                    </p>
                  </div>
                </div>
              </div>

              {overdue && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">This review is overdue</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{review.description}</p>
                </CardContent>
              </Card>

              {/* Review Criteria */}
              {review.review_criteria.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Criteria</CardTitle>
                    <CardDescription>
                      Items that must be evaluated during this review
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {review.review_criteria.map((criterion, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                          <span className="text-sm">{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Approval Chain */}
              {review.approval_chain.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Approval Chain</CardTitle>
                    <CardDescription>
                      Required approval levels and current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {review.approval_chain.map((level, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">Level {level.level}</Badge>
                            <span className="font-medium">{level.role}</span>
                            {level.user_id && (
                              <span className="text-sm text-muted-foreground">
                                (Assigned to user)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                level.status === 'approved' ? 'default' :
                                level.status === 'rejected' ? 'destructive' : 'secondary'
                              }
                            >
                              {level.status}
                            </Badge>
                            {level.approved_at && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(level.approved_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Comments & Discussion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Existing Comments */}
                    {comments && comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getCommentTypeIcon(comment.comment_type)}
                                <span className="font-medium text-sm">
                                  {comment.user?.name || 'Unknown User'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {comment.comment_type.replace('_', ' ')}
                                </Badge>
                                {comment.is_internal && (
                                  <Badge variant="secondary" className="text-xs">
                                    Internal
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    )}

                    <Separator />

                    {/* Add New Comment */}
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addComment.isPending}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          {userCanApprove && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setChangesDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Request Changes
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setApproveDialogOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this review? This action will move the review to the next approval level or mark it as complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add approval comments (optional)..."
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Review</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this review. This will notify the requester and stop the approval process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                placeholder="Explain why this review is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[80px] mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Comments</label>
              <Textarea
                placeholder="Add any additional context (optional)..."
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                className="min-h-[60px] mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Changes Dialog */}
      <AlertDialog open={changesDialogOpen} onOpenChange={setChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Specify what changes are needed before this review can be approved. The requester will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Required Changes *</label>
              <Textarea
                placeholder="List the changes needed (one per line)..."
                value={requestedChanges}
                onChange={(e) => setRequestedChanges(e.target.value)}
                className="min-h-[100px] mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Comments</label>
              <Textarea
                placeholder="Add context or guidance for the changes..."
                value={changeComments}
                onChange={(e) => setChangeComments(e.target.value)}
                className="min-h-[60px] mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestChanges}
              disabled={!requestedChanges.trim()}
            >
              Request Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}