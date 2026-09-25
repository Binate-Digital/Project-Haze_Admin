import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass } from '@/components/ui'
import { ROUTES } from '@/config'

export default function CreateSubAdminPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const submit = async () => {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
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
          <input className={fieldClass()} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            className={fieldClass(Boolean(errors.email))}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            className={fieldClass(Boolean(errors.password))}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
            }}
          />
        </Field>
        <Button disabled={saving} onClick={() => void submit()}>
          {saving ? 'Creating…' : 'Create sub-admin'}
        </Button>
      </Card>
    </div>
  )
}
