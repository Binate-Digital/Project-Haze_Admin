import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, PageHeader, inputClass } from '@/components/ui'
import {
  DataTable,
  FilterBar,
  FilterField,
  useClientPagination,
  type DataTableColumn,
} from '@/components/DataTable'

type Row = Record<string, unknown>

export default function CannabisPreferencesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('other')
  const [sortOrder, setSortOrder] = useState('0')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listCannabisPreferences(true)
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
    if (!q.trim()) return rows
    const needle = q.trim().toLowerCase()
    return rows.filter((row) =>
      `${row.name || ''} ${row.kind || ''}`.toLowerCase().includes(needle),
    )
  }, [rows, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setKind('other')
    setSortOrder('0')
  }

  const startEdit = (row: Row) => {
    setEditingId(String(row._id))
    setName(String(row.name || ''))
    setKind(String(row.kind || 'other'))
    setSortOrder(String(row.sortOrder ?? 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        kind,
        sortOrder: Number(sortOrder) || 0,
      }
      if (editingId) {
        await adminApi.updateCannabisPreference(editingId, payload)
        toast.success('Preference updated')
      } else {
        await adminApi.createCannabisPreference({
          ...payload,
          isActive: true,
        })
        toast.success('Preference created')
      }
      resetForm()
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: Row) => {
    try {
      await adminApi.updateCannabisPreference(String(row._id), {
        isActive: !row.isActive,
      })
      toast.success('Updated')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this preference option?')) return
    try {
      await adminApi.deleteCannabisPreference(id)
      toast.success('Deleted')
      if (editingId === id) resetForm()
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <p className="font-medium">{String(row.name)}</p>,
    },
    {
      key: 'kind',
      header: 'Kind',
      render: (row) => <Badge>{String(row.kind || 'other')}</Badge>,
    },
    {
      key: 'sortOrder',
      header: 'Order',
      render: (row) => <span className="text-sm">{String(row.sortOrder ?? 0)}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.isActive ? 'ok' : 'neutral'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => startEdit(row)}>
            Edit
          </Button>
          <Button variant="ghost" onClick={() => void toggleActive(row)}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="danger" onClick={() => void remove(String(row._id))}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cannabis preferences"
        description="Options shown in the user signup / profile preference dropdown."
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <Card className="space-y-3">
        <p className="text-sm font-medium">
          {editingId ? 'Edit option' : 'Add option'}
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            className={inputClass}
            placeholder="Name (e.g. Indica)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="strain">strain</option>
            <option value="product_type">product_type</option>
            <option value="other">other</option>
          </select>
          <input
            className={inputClass}
            style={{ maxWidth: 100 }}
            placeholder="Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
          </Button>
          {editingId ? (
            <Button variant="ghost" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          ) : null}
        </div>
      </Card>

      <FilterBar>
        <FilterField label="Search" className="min-w-[220px] flex-[2]">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="name or kind"
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
        emptyMessage="No preference options yet."
      />
    </div>
  )
}
