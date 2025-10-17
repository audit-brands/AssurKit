import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PaginationMetadata } from '@/lib/pagination'

interface PaginationControlsProps {
  pagination?: PaginationMetadata
  onPageChange: (page: number) => void
  pageSize: number
  onPageSizeChange: (pageSize: number) => void
  isLoading?: boolean
  pageSizeOptions?: number[]
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100]

export function PaginationControls({
  pagination,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isLoading,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationControlsProps) {
  if (!pagination) {
    return null
  }

  const { page, pages, total } = pagination
  const canGoBack = page > 1
  const canGoForward = page < pages

  return (
    <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-muted-foreground">
        Showing page {page} of {pages} ({total.toLocaleString()} total)
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={pageSize.toString()}
          onValueChange={value => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(option => (
              <SelectItem key={option} value={option.toString()}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoBack || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoForward || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
