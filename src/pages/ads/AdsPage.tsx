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

export default function AdsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [placement, setPlacement] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingAds()
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

  const placements = useMemo(() => {
    return [...new Set(rows.map((r) => String(r.placement || '')).filter(Boolean))]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((ad) => {
      if (placement !== 'all' && String(ad.placement || '') !== placement) return false
      if (!q.trim()) return true
      return `${ad.title || ''} ${ad.description || ''}`
        .toLowerCase()
        .includes(q.trim().toLowerCase())
    })
  }, [rows, placement, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const review = async (id: string, action: 'approve' | 'reject' | 'pause') => {
    try {
      await adminApi.reviewAd(id, action)
      toast.success(`Ad ${action}d`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'title',
      header: 'Campaign',
      render: (ad) => (
        <div>
          <p className="font-medium">{String(ad.title)}</p>
          <p className="line-clamp-1 text-xs text-[var(--haze-muted)]">
            {String(ad.description || '')}
          </p>
        </div>
      ),
    },
    {
      key: 'placement',
      header: 'Placement',
      render: (ad) => <Badge tone="warn">{String(ad.placement || 'explore')}</Badge>,
    },
    {
      key: 'budget',
      header: 'Budget / week',
      render: (ad) => `${String(ad.weeklyBudget || 0)} ${String(ad.currency || 'USD')}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ad) => {
        const id = String(ad._id)
        return (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void review(id, 'approve')}>Approve</Button>
            <Button variant="secondary" onClick={() => void review(id, 'pause')}>
              Pause
            </Button>
            <Button variant="danger" onClick={() => void review(id, 'reject')}>
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Ads moderation"
        description="Pending ad campaigns."
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <FilterBar>
        <FilterField label="Placement">
          <select
            className={inputClass}
            value={placement}
            onChange={(e) => {
              setPlacement(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            {placements.map((p) => (
              <option key={p} value={p}>
                {p}
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
            placeholder="title or description"
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
        emptyMessage="No pending ads."
      />
    </div>
  )
}
