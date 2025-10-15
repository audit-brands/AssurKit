import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type EffectivenessLevel = 'effective' | 'partially-effective' | 'ineffective' | 'not-tested' | 'pending'
export type TrendDirection = 'improving' | 'declining' | 'stable' | null

interface EffectivenessScore {
  level: EffectivenessLevel
  score: number // 0-100
  trend?: TrendDirection
  lastTested?: Date
  testCount?: number
  passRate?: number
}

interface EffectivenessIndicatorProps {
  effectiveness: EffectivenessScore
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EffectivenessIndicator({
  effectiveness,
  showDetails = false,
  size = 'md',
  className
}: EffectivenessIndicatorProps) {
  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'

    switch (effectiveness.level) {
      case 'effective':
        return <CheckCircle2 className={cn(iconSize, 'text-green-600')} />
      case 'partially-effective':
        return <AlertCircle className={cn(iconSize, 'text-yellow-600')} />
      case 'ineffective':
        return <XCircle className={cn(iconSize, 'text-red-600')} />
      case 'not-tested':
        return <HelpCircle className={cn(iconSize, 'text-gray-400')} />
      case 'pending':
        return <HelpCircle className={cn(iconSize, 'text-blue-500 animate-pulse')} />
    }
  }

  const getTrendIcon = () => {
    if (!effectiveness.trend) return null
    const iconSize = 'h-3 w-3'

    switch (effectiveness.trend) {
      case 'improving':
        return <TrendingUp className={cn(iconSize, 'text-green-500')} />
      case 'declining':
        return <TrendingDown className={cn(iconSize, 'text-red-500')} />
      case 'stable':
        return <Minus className={cn(iconSize, 'text-gray-400')} />
    }
  }

  const getColorClasses = () => {
    switch (effectiveness.level) {
      case 'effective':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'partially-effective':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'ineffective':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'not-tested':
        return 'bg-gray-50 border-gray-200 text-gray-600'
      case 'pending':
        return 'bg-blue-50 border-blue-200 text-blue-700'
    }
  }

  const getLabel = () => {
    switch (effectiveness.level) {
      case 'effective':
        return 'Effective'
      case 'partially-effective':
        return 'Partially Effective'
      case 'ineffective':
        return 'Ineffective'
      case 'not-tested':
        return 'Not Tested'
      case 'pending':
        return 'Test Pending'
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 30) return `${days} days ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''} ago`
  }

  const content = (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
      getColorClasses(),
      className
    )}>
      {getIcon()}
      {showDetails && (
        <>
          <div className="flex flex-col">
            <span className={cn(
              'font-medium',
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
            )}>
              {getLabel()}
            </span>
            {effectiveness.score !== undefined && (
              <span className={cn(
                'text-gray-600',
                size === 'sm' ? 'text-xs' : 'text-xs'
              )}>
                Score: {effectiveness.score}%
              </span>
            )}
          </div>
          {getTrendIcon()}
        </>
      )}
    </div>
  )

  if (!showDetails && effectiveness.lastTested) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{getLabel()}</p>
              {effectiveness.score !== undefined && (
                <p>Score: {effectiveness.score}%</p>
              )}
              {effectiveness.lastTested && (
                <p>Tested: {formatDate(effectiveness.lastTested)}</p>
              )}
              {effectiveness.testCount !== undefined && (
                <p>Tests Run: {effectiveness.testCount}</p>
              )}
              {effectiveness.passRate !== undefined && (
                <p>Pass Rate: {effectiveness.passRate}%</p>
              )}
              {effectiveness.trend && (
                <p>Trend: {effectiveness.trend}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

interface EffectivenessMatrixProps {
  controls: Array<{
    id: string
    name: string
    effectiveness: EffectivenessScore
    keyControl?: boolean
  }>
}

export function EffectivenessMatrix({ controls }: EffectivenessMatrixProps) {
  interface SummaryType {
    effective: number
    'partially-effective': number
    ineffective: number
    'not-tested': number
    pending: number
    keyControls: {
      effective: number
      'partially-effective': number
      ineffective: number
      'not-tested': number
      pending: number
    }
  }

  const summary = controls.reduce<SummaryType>((acc, control) => {
    const level = control.effectiveness.level
    acc[level] = (acc[level] || 0) + 1
    if (control.keyControl && acc.keyControls) {
      acc.keyControls[level] = (acc.keyControls[level] || 0) + 1
    }
    return acc
  }, {
    effective: 0,
    'partially-effective': 0,
    ineffective: 0,
    'not-tested': 0,
    pending: 0,
    keyControls: {
      effective: 0,
      'partially-effective': 0,
      ineffective: 0,
      'not-tested': 0,
      pending: 0,
    }
  })

  const totalControls = controls.length
  const effectivePercentage = Math.round((summary.effective / totalControls) * 100)

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Control Effectiveness</h3>
          <Badge variant={effectivePercentage >= 80 ? 'default' : effectivePercentage >= 60 ? 'secondary' : 'destructive'}>
            {effectivePercentage}% Effective
          </Badge>
        </div>

        {/* Distribution Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-800">{summary.effective}</div>
            <div className="text-xs text-green-600">Effective</div>
            {summary.keyControls.effective > 0 && (
              <div className="text-xs text-green-600 mt-1">
                ({summary.keyControls.effective} key)
              </div>
            )}
          </div>

          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-yellow-800">{summary['partially-effective']}</div>
            <div className="text-xs text-yellow-600">Partial</div>
            {summary.keyControls['partially-effective'] > 0 && (
              <div className="text-xs text-yellow-600 mt-1">
                ({summary.keyControls['partially-effective']} key)
              </div>
            )}
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-800">{summary.ineffective}</div>
            <div className="text-xs text-red-600">Ineffective</div>
            {summary.keyControls.ineffective > 0 && (
              <div className="text-xs text-red-600 mt-1">
                ({summary.keyControls.ineffective} key)
              </div>
            )}
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <HelpCircle className="h-8 w-8 text-gray-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-600">{summary['not-tested']}</div>
            <div className="text-xs text-gray-500">Not Tested</div>
            {summary.keyControls['not-tested'] > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ({summary.keyControls['not-tested']} key)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Control Alerts */}
      {(summary.keyControls.ineffective > 0 || summary.keyControls['not-tested'] > 0) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Key Control Alert</h4>
              <p className="text-sm text-red-700 mt-1">
                {summary.keyControls.ineffective > 0 &&
                  `${summary.keyControls.ineffective} key control${summary.keyControls.ineffective > 1 ? 's are' : ' is'} ineffective. `}
                {summary.keyControls['not-tested'] > 0 &&
                  `${summary.keyControls['not-tested']} key control${summary.keyControls['not-tested'] > 1 ? 's have' : ' has'} not been tested.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}