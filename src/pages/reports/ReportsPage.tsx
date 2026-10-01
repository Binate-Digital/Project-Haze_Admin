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

function targetLabel(row: Row): string {
  const t = String(row.targetType || 'user')
  if (t === 'post') {
    const post = row.reportedPostId as Row | undefined
    return `post · ${String(post?.postText || post?._id || row.reportedPostId || '—').slice(0, 40)}`
  }
  if (t === 'comment') {
    const c = row.reportedCommentId as Row | undefined
    return `comment · ${String(c?.comment || c?._id || '—').slice(0, 40)}`
  }
  if (t === 'group') {
    const g = row.reportedGroupId as Row | undefined
    return `group · ${String(g?.name || g?.title || g?._id || '—')}`
  }
  if (t === 'shop' || t === 'store') {
    const s = row.reportedStoreId as Row | undefined
    return `shop · ${String(s?.storeName || s?._id || '—')}`
  }
  const u = row.reportedUserId as Row | undefined
  return `${t} · ${String(u?.businessName || u?.fullName || u?.email || '—')}`
}

export default function ReportsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [targetType, setTargetType] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listReports(
        status === 'all' ? undefined : status,
        targetType,
      )
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
  }, [status, targetType])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (!q.trim()) return true
      const reporter = row.reporterId as Record<string, unknown> | undefined
      const reported = row.reportedUserId as Record<string, unknown> | undefined
      return `${row.reason || ''} ${row.details || ''} ${reporter?.email || ''} ${reported?.email || ''} ${targetLabel(row)}`
        .toLowerCase()
        .includes(q.trim().toLowerCase())
    })
  }, [rows, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const review = async (id: string, next: 'reviewed' | 'dismissed', blockUser = false) => {
    try {
      await adminApi.reviewReport(id, { status: next, blockUser })
      toast.success(blockUser ? 'Reviewed and user blocked' : `Report ${next}`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => (
        <div>
          <p className="font-medium">{String(row.reason)}</p>
          {row.details ? (
            <p className="line-clamp-1 text-xs text-[var(--haze-muted)]">{String(row.details)}</p>
          ) : null}
          {row.hideFromReporter ? (
            <p className="text-xs text-[var(--haze-neon)]">Hidden from reporter feed</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type / Target',
      render: (row) => (
        <div>
          <Badge>{String(row.targetType || 'user')}</Badge>
          <p className="mt-1 max-w-xs text-xs text-[var(--haze-muted)]">{targetLabel(row)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone="warn">{String(row.status)}</Badge>,
    },
    {
      key: 'people',
      header: 'Reporter / Reported',
      render: (row) => {
        const reporter = row.reporterId as Record<string, unknown> | undefined
        const reported = row.reportedUserId as Record<string, unknown> | undefined
        return (
          <p className="text-xs text-[var(--haze-muted)]">
            {String(reporter?.email || reporter?.fullName || '—')}
            <br />
            {String(reported?.email || reported?.fullName || reported?.businessName || '—')}
          </p>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const id = String(row._id)
        return (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void review(id, 'reviewed')}>Reviewed</Button>
            <Button variant="danger" onClick={() => void review(id, 'reviewed', true)}>
              Block user
            </Button>
            <Button variant="ghost" onClick={() => void review(id, 'dismissed')}>
              Dismiss
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Unified moderation: posts, comments, groups, users, businesses, shops."
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <FilterBar>
        <FilterField label="Status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">pending</option>
            <option value="reviewed">reviewed</option>
            <option value="dismissed">dismissed</option>
            <option value="all">all</option>
          </select>
        </FilterField>
        <FilterField label="Target">
          <select
            className={inputClass}
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="post">post</option>
            <option value="comment">comment</option>
            <option value="group">group</option>
            <option value="user">user</option>
            <option value="business">business</option>
            <option value="shop">shop</option>
          </select>
        </FilterField>
        <FilterField label="Search" className="min-w-[220px] flex-[2]">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="reason, email, target"
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={pageRows}
        loading={loading}
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        rowKey={(row) => String(row._id)}
        emptyMessage="No reports."
      />
    </div>
  )
}
