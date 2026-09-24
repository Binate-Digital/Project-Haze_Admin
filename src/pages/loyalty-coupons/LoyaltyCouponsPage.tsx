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

export default function LoyaltyCouponsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listLoyaltyCoupons(
        active === 'all' ? undefined : active === 'yes',
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
  }, [active])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const needle = q.trim().toLowerCase()
    return rows.filter((row) => {
      const hay = `${row.title || ''} ${row.description || ''}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [rows, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const deactivate = async (couponId: string) => {
    if (!window.confirm('Deactivate this loyalty coupon?')) return
    try {
      await adminApi.deleteLoyaltyCoupon(couponId)
      toast.success('Coupon deactivated')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'title',
      header: 'Coupon',
      render: (row) => (
        <div>
          <p className="font-medium">{String(row.title || '')}</p>
          <p className="line-clamp-1 text-xs text-[var(--haze-muted)]">
            {String(row.description || '')}
          </p>
        </div>
      ),
    },
    {
      key: 'points',
      header: 'Points',
      render: (row) => String(row.pointsRequired ?? 0),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (row) =>
        row.discountType === 'percent'
          ? `${String(row.discountValue ?? 0)}%`
          : `$${String(row.discountValue ?? 0)}`,
    },
    {
      key: 'min',
      header: 'Min order',
      render: (row) => `$${String(row.minOrderAmount ?? 0)}`,
    },
    {
      key: 'used',
      header: 'Used',
      render: (row) => String(row.usedCount ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.isActive !== false ? (
          <Badge tone="ok">active</Badge>
        ) : (
          <Badge tone="neutral">inactive</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/loyalty-coupons/${String(row._id)}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          {row.isActive !== false ? (
            <Button variant="danger" onClick={() => void deactivate(String(row._id))}>
              Deactivate
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loyalty coupons"
        description="Users redeem points for these coupons — not as direct cart cash."
        actions={
          <Link to={ROUTES.LOYALTY_COUPONS_CREATE}>
            <Button>Create coupon</Button>
          </Link>
        }
      />
      <FilterBar>
        <FilterField label="Status">
          <select
            className={inputClass}
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            <option value="all">All</option>
            <option value="yes">Active</option>
            <option value="no">Inactive</option>
          </select>
        </FilterField>
        <FilterField label="Search">
          <input
            className={inputClass}
            placeholder="Title or description"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </FilterField>
        <Button variant="ghost" onClick={() => void load()}>
          Refresh
        </Button>
      </FilterBar>
      <DataTable
        columns={columns}
        rows={pageRows}
        loading={loading}
        empty="No loyalty coupons yet"
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(1)
        }}
      />
    </div>
  )
}
