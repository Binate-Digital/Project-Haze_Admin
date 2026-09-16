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

type UserRow = Record<string, unknown>

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [blocked, setBlocked] = useState('all')
  const [q, setQ] = useState('')
  const [verified, setVerified] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listUsers({
        role: role === 'all' ? undefined : role,
        q: q.trim() || undefined,
        blocked: blocked === 'all' ? undefined : blocked,
        limit: 500,
      })
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
  }, [role, blocked])

  const filtered = useMemo(() => {
    if (verified === 'all') return rows
    return rows.filter((row) =>
      verified === 'yes' ? Boolean(row.isVerified) : !row.isVerified,
    )
  }, [rows, verified])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const toggleBlock = async (userId: string, nextBlocked: boolean) => {
    try {
      await adminApi.setUserBlocked(userId, nextBlocked)
      toast.success(nextBlocked ? 'User blocked' : 'User unblocked')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="font-medium">
            {String(row.fullName || row.businessName || row.userName || '—')}
          </p>
          <p className="text-xs text-[var(--haze-muted)]">{String(row.email || '')}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge>{String(row.role)}</Badge>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => String(row.phoneNumber || '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.isBlocked ? <Badge tone="bad">blocked</Badge> : <Badge tone="ok">active</Badge>,
    },
    {
      key: 'verified',
      header: 'Verified',
      render: (row) =>
        row.isVerified ? <Badge tone="ok">yes</Badge> : <Badge tone="warn">no</Badge>,
    },
    {
      key: 'created',
      header: 'Created',
      render: (row) =>
        row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString() : '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant={row.isBlocked ? 'secondary' : 'danger'}
          onClick={() => void toggleBlock(String(row._id), !row.isBlocked)}
        >
          {row.isBlocked ? 'Unblock' : 'Block'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="All platform users with filters and pagination."
        actions={
          <>
            <Button variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
            <Link to={ROUTES.USERS_CREATE_SUBADMIN}>
              <Button>Create sub-admin</Button>
            </Link>
          </>
        }
      />

      <FilterBar>
        <FilterField label="Role">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All</option>
            <option value="user">User</option>
            <option value="business">Business</option>
            <option value="admin">Admin</option>
          </select>
        </FilterField>
        <FilterField label="Blocked">
          <select
            className={inputClass}
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
          >
            <option value="all">All</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>
        </FilterField>
        <FilterField label="Verified">
          <select
            className={inputClass}
            value={verified}
            onChange={(e) => {
              setVerified(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="yes">Verified</option>
            <option value="no">Not verified</option>
          </select>
        </FilterField>
        <FilterField label="Search" className="min-w-[220px] flex-[2]">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="email, name, phone"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load()
            }}
          />
        </FilterField>
        <Button onClick={() => void load()}>Apply</Button>
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
