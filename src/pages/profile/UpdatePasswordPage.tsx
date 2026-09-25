import { useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass } from '@/components/ui'

export default function UpdatePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  const submit = async () => {
    const next: typeof errors = {}
    if (!currentPassword) next.currentPassword = 'Current password is required'
    if (!newPassword) next.newPassword = 'New password is required'
    if (!confirmPassword) next.confirmPassword = 'Confirm password is required'
    else if (newPassword && newPassword !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      await adminApi.updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Update password"
        description="Enter your current password, then choose a new one."
      />

      <Card className="space-y-4">
        <Field label="Current password" error={errors.currentPassword}>
          <input
            type="password"
            className={fieldClass(Boolean(errors.currentPassword))}
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              if (errors.currentPassword) setErrors((p) => ({ ...p, currentPassword: undefined }))
            }}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password" error={errors.newPassword}>
          <input
            type="password"
            className={fieldClass(Boolean(errors.newPassword))}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }))
            }}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword}>
          <input
            type="password"
            className={fieldClass(Boolean(errors.confirmPassword))}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }))
            }}
            autoComplete="new-password"
          />
        </Field>
        <Button disabled={saving} onClick={() => void submit()}>
          {saving ? 'Updating…' : 'Update password'}
        </Button>
      </Card>
    </div>
  )
}
