import { RCMGrid } from '@/components/rcm/rcm-grid'
import { ControlCoverage } from '@/components/rcm/control-coverage'
import { EffectivenessSummary } from '@/components/rcm/effectiveness-summary'

export function RCMPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Risk Control Matrix</h1>
        <p className="text-muted-foreground">
          Comprehensive view of your organization's risk and control landscape
        </p>
      </div>

      <ControlCoverage />
      <EffectivenessSummary />
      <RCMGrid />
    </div>
  )
}