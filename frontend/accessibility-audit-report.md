# AssurKit Accessibility Audit Report

**Date:** TODO
**Auditor:** Codex (Playwright A11y pass)

## Summary

| Severity | Issue | Location | Status | Notes |
| --- | --- | --- | --- | --- |
| High | Skip link missing | Layout | Fixed | Added skip navigation link |
| High | Icon buttons lacked accessible names | Layout & Notifications | Fixed | Added aria-label and sr-only text |
| Medium | Notifications filter tabs lacking labels | Notification Center | Fixed | Added descriptive labels |
| Medium | Error messages lacked role | Login | Fixed | Added `role="alert"` |

## Automated Testing

- axe-core (development runtime)
- Playwright a11y tests (planned)
- Lighthouse (manual trigger)

## Manual Checklist (in progress)

- [x] Skip to content
- [x] Icon buttons accessible
- [ ] Screen reader review
- [ ] Keyboard-only navigation audit
