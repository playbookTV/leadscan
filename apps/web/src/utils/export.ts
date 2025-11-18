/**
 * Utility functions for exporting data to various formats
 */

export interface ExportColumn<T> {
  key: keyof T
  label: string
  formatter?: (value: any) => string
}

/**
 * Export data array to CSV format and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: ExportColumn<T>[]
) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Auto-detect columns if not provided
  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  // Create CSV header
  const header = cols.map(col => `"${col.label}"`).join(',')

  // Create CSV rows
  const rows = data.map(row =>
    cols.map(col => {
      let value = row[col.key]

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value)
      }

      // Handle different value types
      if (value === null || value === undefined) {
        return '""'
      }

      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }

      // Escape quotes and wrap in quotes
      const escaped = String(value).replace(/"/g, '""')
      return `"${escaped}"`
    }).join(',')
  )

  // Combine header and rows
  const csv = [header, ...rows].join('\n')

  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const csvWithBom = bom + csv

  // Create download
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`

  // Trigger download
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to JSON format and trigger download
 */
export function exportToJSON<T>(data: T, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(value: number | string | null): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  return num.toFixed(2)
}

/**
 * Predefined column configurations for common exports
 */
export const LEAD_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { key: 'id', label: 'ID' },
  { key: 'platform', label: 'Platform' },
  { key: 'author_name', label: 'Author' },
  { key: 'author_handle', label: 'Handle' },
  { key: 'post_text', label: 'Content' },
  { key: 'score', label: 'Score' },
  { key: 'status', label: 'Status' },
  { key: 'estimated_budget', label: 'Budget', formatter: formatCurrencyForExport },
  { key: 'timeline', label: 'Timeline' },
  { key: 'technologies', label: 'Technologies', formatter: (val) => Array.isArray(val) ? val.join(', ') : '' },
  { key: 'created_at', label: 'Created Date', formatter: formatDateForExport },
  { key: 'contacted_at', label: 'Contacted Date', formatter: formatDateForExport },
  { key: 'post_url', label: 'Post URL' },
  { key: 'notes', label: 'Notes' }
]

export const KEYWORD_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { key: 'id', label: 'ID' },
  { key: 'keyword', label: 'Keyword' },
  { key: 'platform', label: 'Platform' },
  { key: 'is_active', label: 'Active', formatter: (val) => val ? 'Yes' : 'No' },
  { key: 'leads_found', label: 'Leads Found' },
  { key: 'last_used', label: 'Last Used', formatter: formatDateForExport },
  { key: 'created_at', label: 'Created Date', formatter: formatDateForExport }
]

export const ANALYTICS_EXPORT_COLUMNS: ExportColumn<any>[] = [
  { key: 'date', label: 'Date' },
  { key: 'total_leads', label: 'Total Leads' },
  { key: 'high_priority', label: 'High Priority' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'won', label: 'Won' },
  { key: 'revenue', label: 'Revenue', formatter: formatCurrencyForExport }
]