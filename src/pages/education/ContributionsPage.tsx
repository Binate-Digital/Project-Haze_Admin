import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { ROUTES } from '@/config'

type Row = Record<string, unknown>

export default function ContributionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingContributions()
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
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (type !== 'all' && String(row.type) !== type) return false
      if (!q.trim()) return true
      const biz = row.businessUserId as Record<string, unknown> | undefined
      const hay = `${row.title || ''} ${row.description || ''} ${biz?.businessName || ''} ${biz?.email || ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [rows, q, type])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.reviewContribution(id, action)
      toast.success(`Contribution ${action}d`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'title',
      header: 'Contribution',
      render: (row) => {
        const biz = row.businessUserId as Record<string, unknown> | undefined
        return (
          <div>
            <p className="font-medium">{String(row.title)}</p>
            <p className="text-xs text-[var(--haze-muted)]">
              {String(biz?.businessName || biz?.email || '')}
            </p>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone="warn">{String(row.type)}</Badge>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <p className="max-w-sm line-clamp-2 text-[var(--haze-muted)]">
          {String(row.description || '')}
        </p>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => void review(String(row._id), 'approve')}>Approve</Button>
          <Button variant="danger" onClick={() => void review(String(row._id), 'reject')}>
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Education contributions"
        description="Review pending business submissions."
        actions={
          <>
            <Link to={ROUTES.EDUCATION}>
              <Button variant="ghost">Courses</Button>
            </Link>
            <Button variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
          </>
        }
      />

      <FilterBar>
        <FilterField label="Type">
          <select
            className={inputClass}
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            {[...new Set(rows.map((r) => String(r.type || '')).filter(Boolean))].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
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
            placeholder="title, business, description"
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
        emptyMessage="No pending contributions."
      />
    </div>
  )
}
