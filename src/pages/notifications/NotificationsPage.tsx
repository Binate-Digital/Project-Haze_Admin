import { useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass, textareaFieldClass } from '@/components/ui'

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'all' | 'users' | 'business'>('all')
  const [saving, setSaving] = useState(false)
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})

  const send = async () => {
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Title is required'
    if (!body.trim()) next.body = 'Message is required'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const result = await adminApi.sendNotificationBlast({
        title: title.trim(),
        body: body.trim(),
        audience,
      })
      setLastResult(result)
      toast.success('Blast sent')
      setTitle('')
      setBody('')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Push blasts"
        description="Send broadcast notifications to users and/or businesses."
      />

      <Card className="space-y-4">
        <Field label="Audience">
          <select
            className={fieldClass()}
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'all' | 'users' | 'business')}
          >
            <option value="all">All users + businesses</option>
            <option value="users">Users only</option>
            <option value="business">Businesses only</option>
          </select>
        </Field>
        <Field label="Title" error={errors.title}>
          <input
            className={fieldClass(Boolean(errors.title))}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }))
            }}
          />
        </Field>
        <Field label="Message" error={errors.body}>
          <textarea
            className={textareaFieldClass(Boolean(errors.body))}
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              if (errors.body) setErrors((p) => ({ ...p, body: undefined }))
            }}
          />
        </Field>
        <Button disabled={saving} onClick={() => void send()}>
          {saving ? 'Sending…' : 'Send blast'}
        </Button>
      </Card>

      {lastResult ? (
        <Card className="space-y-1 text-sm text-[var(--haze-muted)]">
          <p>Audience: {String(lastResult.audience)}</p>
          <p>Targeted: {String(lastResult.targeted)}</p>
          <p>Pushed (FCM): {String(lastResult.pushed ?? '—')}</p>
          <p>Stored (in-app): {String(lastResult.stored ?? '—')}</p>
          <p>Skipped (no token): {String(lastResult.skippedNoToken ?? '—')}</p>
          <p>Skipped (disabled): {String(lastResult.skippedDisabled ?? '—')}</p>
          <p>Failed: {String(lastResult.failed ?? '—')}</p>
          {lastResult.failReasons &&
          typeof lastResult.failReasons === 'object' &&
          Object.keys(lastResult.failReasons as object).length ? (
            <div className="mt-3 space-y-1 border-t border-[var(--haze-border)] pt-3">
              <p className="font-medium text-[var(--haze-text)]">FCM fail reasons</p>
              {Object.entries(lastResult.failReasons as Record<string, number>).map(
                ([reason, count]) => (
                  <p key={reason}>
                    {count}× {reason}
                  </p>
                ),
              )}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
