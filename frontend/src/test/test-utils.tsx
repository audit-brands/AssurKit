/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data for tests
export const mockReview = {
  id: 'review-1',
  entity_type: 'test' as const,
  entity_id: 'test-1',
  review_type: 'approval' as const,
  status: 'pending' as const,
  title: 'Test Review',
  description: 'A test review for validation',
  priority: 'medium' as const,
  requested_by_user_id: 'user-1',
  assigned_to_user_id: 'user-2',
  reviewed_by_user_id: null,
  approval_level: 0,
  required_approval_level: 1,
  approval_chain: [],
  due_date: '2024-12-31',
  requested_at: '2024-01-01T00:00:00Z',
  reviewed_at: null,
  completed_at: null,
  review_criteria: ['Accuracy', 'Completeness'],
  comments: [],
  attachments: [],
  decision: null,
  decision_reason: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockNotification = {
  id: 'notification-1',
  user_id: 'user-1',
  title: 'Review Assignment',
  message: 'You have been assigned a new review',
  type: 'assignment' as const,
  priority: 'medium' as const,
  read_at: null,
  archived_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  entity_type: 'test' as const,
  entity_id: 'test-1',
  action_url: '/reviews/review-1',
  action_label: 'View Review',
  metadata: {}
}

export const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Manager' as const
}