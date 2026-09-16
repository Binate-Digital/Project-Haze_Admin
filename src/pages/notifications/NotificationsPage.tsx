import { useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, inputClass, textareaClass } from '@/components/ui'

export default function NotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'all' | 'users' | 'business'>('all')
  const [saving, setSaving] = useState(false)
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required')
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
            className={inputClass}
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'all' | 'users' | 'business')}
          >
            <option value="all">All users + businesses</option>
            <option value="users">Users only</option>
            <option value="business">Businesses only</option>
          </select>
        </Field>
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Message">
          <textarea
            className={textareaClass}
            value={body}
            onChange={(e) => setBody(e.target.value)}
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
        </Card>
      ) : null}
    </div>
  )
}
