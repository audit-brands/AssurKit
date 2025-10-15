import { describe, it, expect } from 'vitest'

// Simple utility functions for review status and priority
const getStatusColor = (status: string) => {
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

const getPriorityColor = (priority: string) => {
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

const getReviewTypeLabel = (type: string) => {
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

describe('Review utilities', () => {
  describe('getStatusColor', () => {
    it('returns correct colors for different statuses', () => {
      expect(getStatusColor('pending')).toBe('secondary')
      expect(getStatusColor('in_review')).toBe('default')
      expect(getStatusColor('approved')).toBe('default')
      expect(getStatusColor('rejected')).toBe('destructive')
      expect(getStatusColor('changes_requested')).toBe('secondary')
      expect(getStatusColor('unknown')).toBe('secondary')
    })
  })

  describe('getPriorityColor', () => {
    it('returns correct colors for different priorities', () => {
      expect(getPriorityColor('urgent')).toBe('destructive')
      expect(getPriorityColor('high')).toBe('default')
      expect(getPriorityColor('medium')).toBe('secondary')
      expect(getPriorityColor('low')).toBe('outline')
      expect(getPriorityColor('unknown')).toBe('outline')
    })
  })

  describe('getReviewTypeLabel', () => {
    it('returns correct labels for review types', () => {
      expect(getReviewTypeLabel('approval')).toBe('Approval')
      expect(getReviewTypeLabel('validation')).toBe('Validation')
      expect(getReviewTypeLabel('quality_check')).toBe('Quality Check')
      expect(getReviewTypeLabel('compliance_review')).toBe('Compliance Review')
      expect(getReviewTypeLabel('custom_type')).toBe('custom_type')
    })
  })
})