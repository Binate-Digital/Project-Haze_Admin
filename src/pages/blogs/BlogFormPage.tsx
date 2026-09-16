import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import {
  Button,
  Card,
  Field,
  FileUpload,
  PageHeader,
  inputClass,
  textareaClass,
} from '@/components/ui'
import { ROUTES } from '@/config'

export default function BlogFormPage() {
  const { blogId } = useParams()
  const isEdit = Boolean(blogId)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [businessUserId, setBusinessUserId] = useState('')
  const [businesses, setBusinesses] = useState<Record<string, unknown>[]>([])
  const [publish, setPublish] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const users = await adminApi.listUsers({ role: 'business', limit: 200 })
        if (alive) setBusinesses(Array.isArray(users) ? users : [])
      } catch {
        /* optional author list */
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!blogId) return
    let alive = true
    ;(async () => {
      try {
        const list = await adminApi.getBlogs({ status: 'all', limit: 500 })
        const row = (Array.isArray(list) ? list : []).find((b) => String(b._id) === blogId)
        if (!row) {
          toast.error('Blog not found')
          navigate(ROUTES.BLOGS)
          return
        }
        if (!alive) return
        setTitle(String(row.title || ''))
        setContent(String(row.content || ''))
        setExistingImage(typeof row.blogImage === 'string' ? row.blogImage : null)
        setPublish(Boolean(row.isApproved && row.isActive))
        setIsFeatured(Boolean(row.isFeatured))
        setIsTrending(Boolean(row.isTrending))
        const author = row.businessUserId as Record<string, unknown> | string | undefined
        if (author && typeof author === 'object' && author._id) {
          setBusinessUserId(String(author._id))
        } else if (typeof author === 'string') {
          setBusinessUserId(author)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [blogId, navigate])

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required')
      return
    }
    if (!isEdit && !coverFiles[0]) {
      toast.error('Cover image is required')
      return
    }
    setSaving(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('content', content.trim())
      form.append('publish', publish ? 'true' : 'false')
      form.append('isFeatured', isFeatured ? 'true' : 'false')
      form.append('isTrending', isTrending ? 'true' : 'false')
      if (businessUserId) form.append('businessUserId', businessUserId)
      if (coverFiles[0]) form.append('cover', coverFiles[0])

      if (isEdit && blogId) {
        await adminApi.updateBlog(blogId, form)
        toast.success('Blog updated')
      } else {
        await adminApi.createBlog(form)
        toast.success(publish ? 'Blog published' : 'Blog saved as draft')
      }
      navigate(ROUTES.BLOGS)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-[var(--haze-muted)]">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={isEdit ? 'Edit blog' : 'Create blog'}
        actions={
          <Link to={ROUTES.BLOGS}>
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />

      <Card className="space-y-4 p-6">
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Content">
          <textarea
            className={textareaClass}
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>
        <Field label="Author (optional business)">
          <select
            className={inputClass}
            value={businessUserId}
            onChange={(e) => setBusinessUserId(e.target.value)}
          >
            <option value="">Admin / default</option>
            {businesses.map((b) => (
              <option key={String(b._id)} value={String(b._id)}>
                {String(b.businessName || b.fullName || b.email || b._id)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cover image">
          {existingImage ? (
            <a href={existingImage} target="_blank" rel="noreferrer" className="mb-2 block">
              <img
                src={existingImage}
                alt=""
                className="h-28 w-44 rounded-lg object-cover border border-[var(--haze-border)]"
              />
            </a>
          ) : null}
          <FileUpload
            label="Upload cover"
            accept="image/*"
            files={coverFiles}
            onChange={setCoverFiles}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Publish immediately (approved + active)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isTrending}
            onChange={(e) => setIsTrending(e.target.checked)}
          />
          Trending
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Link to={ROUTES.BLOGS}>
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : isEdit ? 'Update blog' : 'Create blog'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
