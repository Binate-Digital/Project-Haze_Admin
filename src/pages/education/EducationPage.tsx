import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  FileUpload,
  PageHeader,
  inputClass,
  textareaClass,
} from '@/components/ui'

type LessonDraft = {
  id: string
  name: string
  content: string
}

function newLesson(order = 1): LessonDraft {
  return {
    id: `${Date.now()}-${order}`,
    name: order === 1 ? 'Intro' : `Lesson ${order}`,
    content: '',
  }
}

export default function EducationPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [lessons, setLessons] = useState<LessonDraft[]>([newLesson(1)])
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingContributions()
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const createCourse = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    const cleaned = lessons
      .map((lesson, index) => ({
        order: index + 1,
        name: lesson.name.trim() || `Lesson ${index + 1}`,
        content: lesson.content.trim(),
      }))
      .filter((lesson) => lesson.name || lesson.content)

    if (!cleaned.length) {
      toast.error('Add at least one lesson')
      return
    }

    setSaving(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('description', description)
      form.append('topic', topic)
      form.append('isPublished', 'true')
      form.append('isTrending', 'false')
      form.append('lessons', JSON.stringify(cleaned))
      if (coverFiles[0]) form.append('cover', coverFiles[0])
      await adminApi.createCourse(form)
      toast.success('Course published')
      setTitle('')
      setDescription('')
      setTopic('')
      setLessons([newLesson(1)])
      setCoverFiles([])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.reviewContribution(id, action)
      toast.success(`Contribution ${action}d`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Education"
        description="Publish courses and review business contributions."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Create course</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Topic">
            <input className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={textareaClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Lessons</h3>
            <Button
              variant="secondary"
              onClick={() => setLessons((prev) => [...prev, newLesson(prev.length + 1)])}
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add lesson
              </span>
            </Button>
          </div>
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} className="space-y-3 !p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--haze-muted)]">Lesson {index + 1}</p>
                {lessons.length > 1 ? (
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"
                    onClick={() => setLessons((prev) => prev.filter((l) => l.id !== lesson.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <Field label="Lesson name">
                <input
                  className={inputClass}
                  value={lesson.name}
                  onChange={(e) =>
                    setLessons((prev) =>
                      prev.map((l) => (l.id === lesson.id ? { ...l, name: e.target.value } : l)),
                    )
                  }
                />
              </Field>
              <Field label="Lesson content">
                <textarea
                  className={textareaClass}
                  value={lesson.content}
                  onChange={(e) =>
                    setLessons((prev) =>
                      prev.map((l) =>
                        l.id === lesson.id ? { ...l, content: e.target.value } : l,
                      ),
                    )
                  }
                />
              </Field>
            </Card>
          ))}
        </div>

        <FileUpload
          label="Cover image"
          accept="image/*"
          files={coverFiles}
          onChange={setCoverFiles}
        />

        <Button disabled={saving} onClick={() => void createCourse()}>
          {saving ? 'Publishing…' : 'Publish course'}
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Pending contributions</h2>
        {loading ? (
          <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState message="No pending contributions." />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const id = String(row._id)
              const biz = row.businessUserId as Record<string, unknown> | undefined
              return (
                <Card
                  key={id}
                  className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{String(row.title)}</h3>
                      <Badge tone="warn">{String(row.type)}</Badge>
                    </div>
                    <p className="text-sm text-[var(--haze-muted)]">
                      {String(biz?.businessName || biz?.email || '')} —{' '}
                      {String(row.description || '')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void review(id, 'approve')}>Approve</Button>
                    <Button variant="danger" onClick={() => void review(id, 'reject')}>
                      Reject
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
