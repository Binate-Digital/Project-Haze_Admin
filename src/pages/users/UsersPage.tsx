import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, EmptyState, Field, PageHeader, inputClass } from '@/components/ui'

export default function UsersPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [q, setQ] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listUsers({
        role: role === 'all' ? undefined : role,
        q: q.trim() || undefined,
      })
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const toggleBlock = async (userId: string, blocked: boolean) => {
    try {
      await adminApi.setUserBlocked(userId, blocked)
      toast.success(blocked ? 'User blocked' : 'User unblocked')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const createAdmin = async () => {
    if (!email.trim() || !password) {
      toast.error('Email and password required')
      return
    }
    setSaving(true)
    try {
      await adminApi.createSubAdmin({
        email: email.trim(),
        password,
        fullName: fullName.trim() || undefined,
      })
      toast.success('Sub-admin created')
      setEmail('')
      setPassword('')
      setFullName('')
      setRole('admin')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Search users, block/unblock accounts, and create sub-admins."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Create sub-admin</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Full name">
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
        <Button disabled={saving} onClick={() => void createAdmin()}>
          {saving ? 'Creating…' : 'Create sub-admin'}
        </Button>
      </Card>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Role">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">all</option>
            <option value="user">user</option>
            <option value="business">business</option>
            <option value="admin">admin</option>
          </select>
        </Field>
        <Field label="Search">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="email, name, phone"
          />
        </Field>
        <Button onClick={() => void load()}>Search</Button>
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const id = String(row._id)
            const blocked = Boolean(row.isBlocked)
            return (
              <Card
                key={id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">
                      {String(row.fullName || row.businessName || row.email || 'User')}
                    </h3>
                    <Badge>{String(row.role)}</Badge>
                    {blocked ? <Badge tone="bad">blocked</Badge> : <Badge tone="ok">active</Badge>}
                  </div>
                  <p className="text-sm text-[var(--haze-muted)]">
                    {String(row.email || '')} {row.phoneNumber ? `· ${String(row.phoneNumber)}` : ''}
                  </p>
                </div>
                <Button
                  variant={blocked ? 'secondary' : 'danger'}
                  onClick={() => void toggleBlock(id, !blocked)}
                >
                  {blocked ? 'Unblock' : 'Block'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
