import { useState } from 'react'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useArchiveNotification,
  type Notification
} from '@/hooks/use-notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  BellDot,
  Check,
  CheckCheck,
  Archive,
  MoreHorizontal,
  Settings,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState('all')
  const [isOpen, setIsOpen] = useState(false)

  const { data: unreadCount } = useUnreadNotificationCount()
  const { data: notificationData, isLoading } = useNotifications({
    read: activeTab === 'unread' ? false : undefined,
    archived: false,
    limit: 20
  })

  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const archiveNotification = useArchiveNotification()

  const notifications = notificationData?.items || []

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification.mutateAsync(notificationId)
    } catch (error) {
      console.error('Failed to archive notification:', error)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'assignment': return <User className="h-4 w-4 text-blue-600" />
      case 'due_date': return <Calendar className="h-4 w-4 text-orange-600" />
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'approval': return <CheckCheck className="h-4 w-4 text-green-600" />
      case 'comment': return <FileText className="h-4 w-4 text-purple-600" />
      case 'status_change': return <Clock className="h-4 w-4 text-gray-600" />
      case 'system': return <Bell className="h-4 w-4 text-gray-600" />
      default: return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount && unreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={!unreadCount || unreadCount === 0}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Settings</DropdownMenuLabel>
                    <DropdownMenuItem>
                      Notification preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Email settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread" className="relative">
                  Unread
                  {unreadCount && unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No notifications</h3>
                      <p className="text-muted-foreground">
                        You're all caught up!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer',
                            !notification.read_at && 'bg-blue-50 border-l-4 border-l-blue-500'
                          )}
                          onClick={() => {
                            if (!notification.read_at) {
                              handleMarkAsRead(notification.id)
                            }
                            if (notification.action_url) {
                              window.open(notification.action_url, '_blank')
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm line-clamp-1">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      variant={getPriorityColor(notification.priority)}
                                      className="text-xs"
                                    >
                                      {notification.priority}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(notification.created_at)}
                                    </span>
                                    {notification.action_url && (
                                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.read_at && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMarkAsRead(notification.id)
                                        }}
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleArchive(notification.id)
                                      }}
                                    >
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <ScrollArea className="h-96">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.filter(n => !n.read_at).length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCheck className="h-12 w-12 mx-auto text-green-600 mb-4" />
                      <h3 className="text-lg font-medium">All caught up!</h3>
                      <p className="text-muted-foreground">
                        No unread notifications
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications
                        .filter(n => !n.read_at)
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer bg-blue-50 border-l-4 border-l-blue-500"
                            onClick={() => {
                              handleMarkAsRead(notification.id)
                              if (notification.action_url) {
                                window.open(notification.action_url, '_blank')
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm line-clamp-1">
                                      {notification.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge
                                        variant={getPriorityColor(notification.priority)}
                                        className="text-xs"
                                      >
                                        {notification.priority}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatTimeAgo(notification.created_at)}
                                      </span>
                                      {notification.action_url && (
                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMarkAsRead(notification.id)
                                        }}
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleArchive(notification.id)
                                        }}
                                      >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}