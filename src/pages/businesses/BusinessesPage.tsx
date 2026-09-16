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

type Row = Record<string, unknown>

function businessUserIdOf(row: Row) {
  const user = row.businessUserId as { _id?: string } | string | undefined
  if (typeof user === 'string') return user
  if (user?._id) return user._id
  return ''
}

export default function BusinessesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [city, setCity] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingBusinesses()
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

  const cities = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((row) => {
      const c = (row.address as { city?: string } | undefined)?.city
      if (c) set.add(c)
    })
    return [...set]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const address = row.address as { city?: string } | undefined
      if (city !== 'all' && address?.city !== city) return false
      if (!q.trim()) return true
      const biz = row.businessUserId as Record<string, unknown> | undefined
      const hay = `${row.storeName || ''} ${biz?.businessName || ''} ${biz?.email || ''} ${address?.city || ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [rows, q, city])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const approve = async (businessUserId: string) => {
    try {
      await adminApi.approveBusiness(businessUserId)
      toast.success('Business approved')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const reject = async (businessUserId: string) => {
    const reason = window.prompt('Rejection reason') || ''
    if (!reason.trim()) return
    try {
      await adminApi.rejectBusiness(businessUserId, reason.trim())
      toast.success('Business rejected')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'store',
      header: 'Store',
      render: (row) => {
        const biz = row.businessUserId as Record<string, unknown> | undefined
        return (
          <div>
            <p className="font-medium">{String(row.storeName || 'Untitled store')}</p>
            <p className="text-xs text-[var(--haze-muted)]">
              {String(biz?.businessName || biz?.email || '—')}
            </p>
          </div>
        )
      },
    },
    {
      key: 'city',
      header: 'City',
      render: (row) =>
        String((row.address as { city?: string } | undefined)?.city || '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge tone="warn">pending</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const storeId = String(row._id || '')
        const businessUserId = businessUserIdOf(row)
        return (
          <div className="flex flex-wrap gap-2">
            <Link to={`/businesses/${storeId}`}>
              <Button variant="ghost">Details</Button>
            </Link>
            <Button disabled={!businessUserId} onClick={() => void approve(businessUserId)}>
              Approve
            </Button>
            <Button
              variant="danger"
              disabled={!businessUserId}
              onClick={() => void reject(businessUserId)}
            >
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
        title="Business verification"
        description="Pending store registrations."
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <FilterBar>
        <FilterField label="City">
          <select
            className={inputClass}
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
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
            placeholder="store, business, email"
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
        emptyMessage="No pending businesses."
      />
    </div>
  )
}
