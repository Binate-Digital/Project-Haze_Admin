import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, inputClass, textareaClass } from '@/components/ui'
import { ROUTES } from '@/config'

const TYPES = ['terms_conditions', 'privacy_policy'] as const

export default function LegalFormPage() {
  const { legalId } = useParams()
  const isEdit = Boolean(legalId)
  const navigate = useNavigate()
  const [type, setType] = useState<(typeof TYPES)[number]>('terms_conditions')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!legalId) return
    let alive = true
    ;(async () => {
      try {
        const list = await adminApi.getLegalContent()
        const row = (Array.isArray(list) ? list : []).find((item) => String(item._id) === legalId)
        if (!row) {
          toast.error('Document not found')
          navigate(ROUTES.LEGAL)
          return
        }
        if (!alive) return
        setType(row.type === 'privacy_policy' ? 'privacy_policy' : 'terms_conditions')
        setTitle(String(row.title || ''))
        setContent(String(row.content || ''))
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [legalId, navigate])

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit && legalId) {
        await adminApi.updateLegalContent({
          id: legalId,
          title: title.trim(),
          type,
          content: content.trim(),
        })
        toast.success('Legal content updated')
      } else {
        await adminApi.createLegalContent({
          type,
          title: title.trim(),
          content: content.trim(),
        })
        toast.success('Legal content created')
      }
      navigate(ROUTES.LEGAL)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-[var(--haze-muted)]">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={isEdit ? 'Edit legal document' : 'Create legal document'}
        actions={
          <Link to={ROUTES.LEGAL}>
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Content">
          <textarea
            className={textareaClass}
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </Button>
      </Card>
    </div>
  )
}
