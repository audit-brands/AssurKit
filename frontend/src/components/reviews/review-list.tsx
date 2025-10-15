import { useState } from 'react'
import { useReviews, useDeleteReview, type Review, type ReviewFilters } from '@/hooks/use-reviews'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ClipboardCheck,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { ReviewForm } from './review-form'
import { ReviewDetails } from './review-details'
import { format, isAfter, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

export function ReviewList() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ReviewFilters>({
    limit: 50,
    offset: 0
  })

  const { data: reviewsData, isLoading } = useReviews(filters)
  const deleteReview = useDeleteReview()

  const reviews = reviewsData?.items || []
  const total = reviewsData?.total || 0

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in_review':
        return <AlertCircle className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'changes_requested':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'in_review':
        return 'default'
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'changes_requested':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getPriorityColor = (priority: Review['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getReviewTypeLabel = (type: Review['review_type']) => {
    switch (type) {
      case 'approval':
        return 'Approval'
      case 'validation':
        return 'Validation'
      case 'quality_check':
        return 'Quality Check'
      case 'compliance_review':
        return 'Compliance Review'
      default:
        return type
    }
  }

  const isOverdue = (review: Review) => {
    if (!review.due_date) return false
    return isAfter(new Date(), parseISO(review.due_date))
  }

  const filteredReviews = reviews.filter(review => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      review.title.toLowerCase().includes(query) ||
      review.description.toLowerCase().includes(query) ||
      review.entity_type.toLowerCase().includes(query) ||
      review.review_type.toLowerCase().includes(query) ||
      review.status.toLowerCase().includes(query)
    )
  })

  const handleEditReview = (review: Review) => {
    setEditingReview(review)
    setShowReviewForm(true)
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview.mutateAsync(reviewId)
      } catch (error) {
        console.error('Failed to delete review:', error)
      }
    }
  }

  const handleFilterChange = (key: keyof ReviewFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }))
  }

  const clearFilters = () => {
    setFilters({
      limit: 50,
      offset: 0
    })
  }

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ReviewFilters]
    return value !== undefined && value !== null &&
           (Array.isArray(value) ? value.length > 0 : true) &&
           key !== 'limit' && key !== 'offset'
  }).length

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Reviews
              </CardTitle>
              <CardDescription>
                Manage review workflows and approval processes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button onClick={() => setShowReviewForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Review
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status?.[0] || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('status', value === 'all' ? undefined : [value])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="changes_requested">Changes Requested</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review Type</Label>
                <Select
                  value={filters.review_type?.[0] || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('review_type', value === 'all' ? undefined : [value])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="validation">Validation</SelectItem>
                    <SelectItem value="quality_check">Quality Check</SelectItem>
                    <SelectItem value="compliance_review">Compliance Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select
                  value={filters.entity_type?.[0] || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('entity_type', value === 'all' ? undefined : [value])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="control">Control</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={filters.priority?.[0] || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('priority', value === 'all' ? undefined : [value])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading reviews...</div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-muted-foreground">
                {searchQuery || activeFiltersCount > 0 ? 'No reviews match your criteria' : 'No reviews found'}
              </div>
              {!searchQuery && activeFiltersCount === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowReviewForm(true)}
                >
                  Create your first review
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => {
                  const overdue = isOverdue(review)

                  return (
                    <TableRow
                      key={review.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        overdue && 'border-l-4 border-l-destructive'
                      )}
                      onClick={() => setSelectedReview(review)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{review.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {review.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getReviewTypeLabel(review.review_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm capitalize">{review.entity_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {review.entity_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(review.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(review.status)}
                          <span className="capitalize">{review.status.replace('_', ' ')}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(review.priority)}>
                          {review.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {review.assigned_to_user ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{review.assigned_to_user.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {review.due_date ? (
                          <div className={cn(
                            'flex items-center gap-2 text-sm',
                            overdue && 'text-destructive font-medium'
                          )}>
                            <Calendar className="h-4 w-4" />
                            {format(parseISO(review.due_date), 'MMM d, yyyy')}
                            {overdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setSelectedReview(review)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditReview(review)}>
                              Edit Review
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              Delete Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {total > (filters.limit || 50) && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((filters.offset || 0) + 1, total)} to{' '}
                {Math.min((filters.offset || 0) + (filters.limit || 50), total)} of {total} reviews
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.offset || 0) === 0}
                  onClick={() =>
                    handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.offset || 0) + (filters.limit || 50) >= total}
                  onClick={() =>
                    handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Details Modal */}
      {selectedReview && (
        <ReviewDetails
          reviewId={selectedReview.id}
          open={!!selectedReview}
          onOpenChange={(open) => !open && setSelectedReview(null)}
        />
      )}

      {/* Review Form Modal */}
      <ReviewForm
        review={editingReview || undefined}
        open={showReviewForm}
        onOpenChange={(open) => {
          setShowReviewForm(open)
          if (!open) {
            setEditingReview(null)
          }
        }}
        onSuccess={() => {
          setShowReviewForm(false)
          setEditingReview(null)
        }}
      />
    </>
  )
}