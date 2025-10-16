## Frontend API Integration Update

### Summary
- Hooked RCM dashboards and controls UI to the Slim API instead of mock builders.
- Normalized request/response shapes across entity hooks (companies, processes, subprocesses, risks, controls).
- Surfaced backend-driven metrics in RCM visualizations and control tables.

### Details
- Added API mappers/payload builders for companies, processes, subprocesses, and risks to match controller responses (`frontend/src/hooks/use-*.ts`).
- Reworked control hooks to:
  - hydrate risk associations from `/api/risk-control-matrix`
  - map automation/frequency enums to backend options
  - post updates through `/api/manage/controls` plus assignment endpoints
- Rebuilt `useRCMMatrix` to consume `/api/risk-control-matrix`, providing consistent nodes/relationships/statistics.
- Updated RCM grid filtering to use normalized risk levels and new control metadata.
- Tightened control form validation (owner email, required description) and aligned select lists with backend allowed values.
- Adjusted control table display and delete flow to handle multi-risk associations.

### Validation
- `npm run typecheck`
