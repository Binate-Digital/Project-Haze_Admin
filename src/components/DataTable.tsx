import type { ReactNode } from 'react'
import { Button, Card, EmptyState, Field, inputClass } from '@/components/ui'

export type DataTableColumn<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Card className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      {children}
    </Card>
  )
}

export function FilterField({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`min-w-[160px] flex-1 ${className}`}>
      <Field label={label}>{children}</Field>
    </div>
  )
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyMessage = 'No records found.',
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  rowKey,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  loading?: boolean
  emptyMessage?: string
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  rowKey: (row: T) => string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-[var(--haze-border)] bg-[var(--haze-panel)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/20 text-xs uppercase tracking-wide text-[var(--haze-muted)]">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3 font-medium ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-[var(--haze-muted)]"
                  >
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    <EmptyState message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="border-t border-[var(--haze-border)] hover:bg-white/[0.02]"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 align-middle ${col.className || ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--haze-muted)]">
          Showing {from}-{to} of {total}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onPageSizeChange ? (
            <select
              className={`${inputClass} !w-auto`}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          ) : null}
          <Button
            variant="ghost"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--haze-muted)]">
            Page {safePage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useClientPagination<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)
  return { total, totalPages, safePage, pageRows }
}
