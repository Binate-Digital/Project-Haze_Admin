import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, inputClass } from '@/components/ui'
import { ROUTES } from '@/config'

export default function CreateSubAdminPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
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
      navigate(ROUTES.USERS)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Create sub-admin"
        description="Add a new admin account."
        actions={
          <Link to={ROUTES.USERS}>
            <Button variant="ghost">Back to users</Button>
          </Link>
        }
      />

      <Card className="space-y-4">
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
        <Button disabled={saving} onClick={() => void submit()}>
          {saving ? 'Creating…' : 'Create sub-admin'}
        </Button>
      </Card>
    </div>
  )
}
