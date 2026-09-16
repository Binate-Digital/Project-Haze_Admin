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

export default function PackagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [packageType, setPackageType] = useState('all')
  const [active, setActive] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPackages(
        packageType === 'all' ? undefined : packageType,
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
  }, [packageType])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (active === 'yes' && row.isActive === false) return false
      if (active === 'no' && row.isActive !== false) return false
      if (!q.trim()) return true
      const hay = `${row.packageName || ''} ${row.description || ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [rows, active, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const remove = async (packageId: string) => {
    if (!window.confirm('Delete this package?')) return
    try {
      await adminApi.deletePackage(packageId)
      toast.success('Package deleted')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      header: 'Package',
      render: (row) => (
        <div>
          <p className="font-medium">{String(row.packageName || row.name)}</p>
          <p className="line-clamp-1 text-xs text-[var(--haze-muted)]">
            {String(row.description || '')}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge>{String(row.packageType || 'store')}</Badge>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (row) => String(row.price ?? 0),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => `${String(row.durationInDays || 30)} days`,
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
          <Link to={`/packages/${String(row._id)}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="danger" onClick={() => void remove(String(row._id))}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Packages"
        description="Store and ads subscription plans."
        actions={
          <>
            <Button variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
            <Link to={ROUTES.PACKAGES_CREATE}>
              <Button>Create package</Button>
            </Link>
          </>
        }
      />

      <FilterBar>
        <FilterField label="Type">
          <select
            className={inputClass}
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
          >
            <option value="all">All</option>
            <option value="store">Store</option>
            <option value="ads">Ads</option>
          </select>
        </FilterField>
        <FilterField label="Status">
          <select
            className={inputClass}
            value={active}
            onChange={(e) => {
              setActive(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="yes">Active</option>
            <option value="no">Inactive</option>
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
            placeholder="name or description"
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
      />
    </div>
  )
}
