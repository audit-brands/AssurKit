/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert an array of objects to CSV format
 */
export function objectArrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return ''

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])

  // Create header row
  const headerRow = csvHeaders.join(',')

  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header]
      // Handle different value types
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""')
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return String(value)
    }).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Convert a record object to CSV format
 */
export function recordToCSV(data: Record<string, unknown>): string {
  const rows = Object.entries(data).map(([key, value]) => {
    const stringValue = typeof value === 'object' && value !== null
      ? JSON.stringify(value)
      : String(value)
    return `${key},${stringValue}`
  })
  return rows.join('\n')
}

/**
 * Download a string as a CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Create a multi-sheet CSV export (sections separated by blank lines)
 */
export function createMultiSectionCSV(sections: Array<{
  title: string
  data: string
}>): string {
  return sections.map(section => {
    return `${section.title}\n${section.data}`
  }).join('\n\n')
}
