import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
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

type LessonDraft = { id: string; name: string; content: string }

function newLesson(order = 1): LessonDraft {
  return {
    id: `${Date.now()}-${order}`,
    name: order === 1 ? 'Intro' : `Lesson ${order}`,
    content: '',
  }
}

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [lessons, setLessons] = useState<LessonDraft[]>([newLesson(1)])
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

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
      navigate(ROUTES.EDUCATION)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Create course"
        actions={
          <Link to={ROUTES.EDUCATION}>
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />

      <Card className="space-y-4">
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
    </div>
  )
}
