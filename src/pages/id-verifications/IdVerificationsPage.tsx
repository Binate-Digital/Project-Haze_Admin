import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, PageHeader, inputClass } from '@/components/ui'
import {
  DataTable,
  FilterBar,
  FilterField,
  useClientPagination,
  type DataTableColumn,
} from '@/components/DataTable'

type Row = Record<string, unknown>

export default function IdVerificationsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listIdVerifications(status)
      setRows(Array.isArray(data) ? data : [])
      setPage(1)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const needle = q.trim().toLowerCase()
    return rows.filter((row) =>
      `${row.fullName || ''} ${row.businessName || ''} ${row.email || ''} ${row.phoneNumber || ''}`
        .toLowerCase()
        .includes(needle),
    )
  }, [rows, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const review = async (userId: string, action: 'approve' | 'reject') => {
    const note =
      action === 'reject'
        ? window.prompt('Rejection note (optional)') || undefined
        : undefined
    try {
      await adminApi.reviewIdVerification(userId, { action, note })
      toast.success(action === 'approve' ? 'ID approved' : 'ID rejected')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div>
          <p className="font-medium">
            {String(row.fullName || row.businessName || '—')}
          </p>
          <p className="text-xs text-[var(--haze-muted)]">{String(row.email || '')}</p>
          <p className="text-xs text-[var(--haze-muted)]">{String(row.role || '')}</p>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'ID image',
      render: (row) =>
        row.uploadIdImg ? (
          <a
            href={String(row.uploadIdImg)}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--haze-accent)] underline"
          >
            View ID
          </a>
        ) : (
          <span className="text-sm text-[var(--haze-muted)]">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone="warn">{String(row.idVerificationStatus || 'none')}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="!bg-[#FFD700] !text-black hover:!bg-[#e6c200]"
            onClick={() => void review(String(row._id), 'approve')}
          >
            Approve
          </Button>
          <Button type="button" variant="secondary" onClick={() => void review(String(row._id), 'reject')}>
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="ID verification"
        description="Review uploaded government IDs for age / identity verification."
      />

      <FilterBar>
        <FilterField label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </FilterField>
        <FilterField label="Search">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or email"
          />
        </FilterField>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={pageRows}
        loading={loading}
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(row) => String(row._id)}
      />
    </div>
  )
}
