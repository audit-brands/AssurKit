import { useState } from 'react'
import { ReviewList } from '@/components/reviews/review-list'
import { usePendingReviews, useOverdueReviews, useMyReviews } from '@/hooks/use-reviews'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  User,
} from 'lucide-react'

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState('all')

  const { data: pendingReviews = [] } = usePendingReviews()
  const { data: overdueReviews = [] } = useOverdueReviews()
  const { data: myReviews = [] } = useMyReviews()

  const pendingCount = pendingReviews.length
  const overdueCount = overdueReviews.length
  const myReviewsCount = myReviews.length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
          <p className="text-muted-foreground">
            Manage review workflows and approval processes
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Reviews</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myReviewsCount}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to me
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingCount + myReviewsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              All active reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Overdue
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mine" className="relative">
            My Reviews
            {myReviewsCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {myReviewsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ReviewList />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <ReviewList />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <ReviewList />
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <ReviewList />
        </TabsContent>
      </Tabs>
    </div>
  )
}