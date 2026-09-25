import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass, textareaFieldClass } from '@/components/ui'
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
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

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
    const next: typeof errors = {}
    if (!title.trim()) next.title = 'Title is required'
    if (!content.trim()) next.content = 'Content is required'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
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
              className={fieldClass()}
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
        </div>
        <Field label="Content" error={errors.content}>
          <textarea
            className={textareaFieldClass(Boolean(errors.content))}
            rows={12}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (errors.content) setErrors((p) => ({ ...p, content: undefined }))
            }}
          />
        </Field>
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </Button>
      </Card>
    </div>
  )
}
