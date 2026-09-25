import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  fieldClass,
  textareaFieldClass,
} from '@/components/ui'
import { ROUTES } from '@/config'

type LessonDraft = {
  id: string
  name: string
  type: 'text' | 'video'
  content: string
  videoFiles: File[]
  existingVideoUrl: string | null
}

type FormErrors = {
  title?: string
  lessons?: string
  lessonErrors?: Record<string, { name?: string; content?: string; video?: string }>
}

function newLesson(order = 1): LessonDraft {
  return {
    id: `${Date.now()}-${order}`,
    name: order === 1 ? 'Intro' : `Lesson ${order}`,
    type: 'text',
    content: '',
    videoFiles: [],
    existingVideoUrl: null,
  }
}

export default function CreateCoursePage() {
  const { courseId } = useParams()
  const isEdit = Boolean(courseId)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [isTrending, setIsTrending] = useState(false)
  const [hostedByBusinessId, setHostedByBusinessId] = useState('')
  const [sponsoredByBusinessId, setSponsoredByBusinessId] = useState('')
  const [lessons, setLessons] = useState<LessonDraft[]>([newLesson(1)])
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [existingCover, setExistingCover] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!courseId) return
    let alive = true
    ;(async () => {
      try {
        const data = await adminApi.getCourse(courseId)
        if (!alive) return
        setTitle(String(data.title || ''))
        setDescription(String(data.description || ''))
        setTopic(String(data.topic || data.category || ''))
        setIsPublished(Boolean(data.isPublished))
        setIsTrending(Boolean(data.isTrending))
        setExistingCover(typeof data.thumbnail === 'string' ? data.thumbnail : null)
        setHostedByBusinessId(
          data.hostedByBusinessId ? String(data.hostedByBusinessId) : '',
        )
        setSponsoredByBusinessId(
          data.sponsoredByBusinessId ? String(data.sponsoredByBusinessId) : '',
        )

        const apiLessons = Array.isArray(data.lessons) ? data.lessons : []
        if (apiLessons.length) {
          setLessons(
            apiLessons.map((lesson, index) => {
              const type =
                lesson.type === 'video' || lesson.videoUrl ? 'video' : 'text'
              return {
                id: String(lesson._id || `${Date.now()}-${index}`),
                name: String(lesson.title || lesson.name || `Lesson ${index + 1}`),
                type: type as 'text' | 'video',
                content: String(lesson.content || lesson.description || ''),
                videoFiles: [],
                existingVideoUrl:
                  typeof lesson.videoUrl === 'string' ? lesson.videoUrl : null,
              }
            }),
          )
        } else {
          setLessons([newLesson(1)])
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error))
        navigate(ROUTES.EDUCATION)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [courseId, navigate])

  const validate = (): boolean => {
    const next: FormErrors = { lessonErrors: {} }
    if (!title.trim()) next.title = 'Title is required'

    const lessonErrors: Record<
      string,
      { name?: string; content?: string; video?: string }
    > = {}
    let hasValidLesson = false

    lessons.forEach((lesson) => {
      const name = lesson.name.trim()
      const content = lesson.content.trim()
      const hasVideo = lesson.videoFiles.length > 0 || Boolean(lesson.existingVideoUrl)
      const row: { name?: string; content?: string; video?: string } = {}

      if (!name) row.name = 'Lesson name is required'
      if (lesson.type === 'text' && !content) {
        row.content = 'Text lessons need content'
      }
      if (lesson.type === 'video' && !hasVideo) {
        row.video = 'Video lessons need a video file'
      }

      if (Object.keys(row).length) {
        lessonErrors[lesson.id] = row
      } else {
        hasValidLesson = true
      }
    })

    if (Object.keys(lessonErrors).length) next.lessonErrors = lessonErrors
    if (!hasValidLesson) next.lessons = 'Add at least one valid lesson'

    setErrors(next)
    const ok =
      !next.title &&
      !next.lessons &&
      Object.keys(next.lessonErrors || {}).length === 0
    if (!ok) toast.error('Please fix the highlighted fields')
    return ok
  }

  const save = async () => {
    if (!validate()) return

    const cleaned = lessons.map((lesson, index) => ({
      order: index,
      title: lesson.name.trim() || `Lesson ${index + 1}`,
      name: lesson.name.trim() || `Lesson ${index + 1}`,
      type: lesson.type,
      content: lesson.type === 'text' ? lesson.content.trim() : '',
      videoUrl:
        lesson.type === 'video' && !lesson.videoFiles[0]
          ? lesson.existingVideoUrl || undefined
          : undefined,
      videoKey: lesson.type === 'video' ? `lessonVideo_${index}` : undefined,
    }))

    setSaving(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('description', description)
      form.append('topic', topic)
      form.append('isPublished', isPublished ? 'true' : 'false')
      form.append('status', isPublished ? 'published' : 'draft')
      form.append('isTrending', isTrending ? 'true' : 'false')
      form.append('hostedByBusinessId', hostedByBusinessId.trim() || '')
      form.append('sponsoredByBusinessId', sponsoredByBusinessId.trim() || '')
      form.append('lessons', JSON.stringify(cleaned))
      if (coverFiles[0]) form.append('cover', coverFiles[0])
      lessons.forEach((lesson, index) => {
        if (lesson.type === 'video' && lesson.videoFiles[0]) {
          form.append(`lessonVideo_${index}`, lesson.videoFiles[0])
        }
      })

      if (isEdit && courseId) {
        await adminApi.updateCourse(courseId, form)
        toast.success('Course updated')
      } else {
        await adminApi.createCourse(form)
        toast.success(isPublished ? 'Course published' : 'Course saved as draft')
      }
      navigate(ROUTES.EDUCATION)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-[var(--haze-muted)]">Loading…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={isEdit ? 'Update course' : 'Create course'}
        actions={
          <Link to={ROUTES.EDUCATION}>
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />

      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" error={errors.title}>
            <input
              className={fieldClass(Boolean(errors.title))}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
              }}
            />
          </Field>
          <Field label="Topic">
            <input className={fieldClass()} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={textareaFieldClass()}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Hosted by (business user id, optional)">
            <input
              className={fieldClass()}
              value={hostedByBusinessId}
              placeholder="Business user ObjectId"
              onChange={(e) => setHostedByBusinessId(e.target.value)}
            />
          </Field>
          <Field label="Sponsored by (business user id, optional)">
            <input
              className={fieldClass()}
              value={sponsoredByBusinessId}
              placeholder="Business user ObjectId"
              onChange={(e) => setSponsoredByBusinessId(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Published
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isTrending}
              onChange={(e) => setIsTrending(e.target.checked)}
            />
            Trending
          </label>
        </div>

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
          {errors.lessons ? <p className="text-xs text-red-400">{errors.lessons}</p> : null}

          {lessons.map((lesson, index) => {
            const lessonError = errors.lessonErrors?.[lesson.id]
            return (
              <Card key={lesson.id} className="space-y-3 !p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--haze-muted)]">Lesson {index + 1}</p>
                  {lessons.length > 1 ? (
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"
                      onClick={() =>
                        setLessons((prev) => prev.filter((l) => l.id !== lesson.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <Field label="Lesson name" error={lessonError?.name}>
                  <input
                    className={fieldClass(Boolean(lessonError?.name))}
                    value={lesson.name}
                    onChange={(e) =>
                      setLessons((prev) =>
                        prev.map((l) =>
                          l.id === lesson.id ? { ...l, name: e.target.value } : l,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Lesson type">
                  <select
                    className={fieldClass()}
                    value={lesson.type}
                    onChange={(e) =>
                      setLessons((prev) =>
                        prev.map((l) =>
                          l.id === lesson.id
                            ? { ...l, type: e.target.value as 'text' | 'video' }
                            : l,
                        ),
                      )
                    }
                  >
                    <option value="text">Text</option>
                    <option value="video">Video</option>
                  </select>
                </Field>
                {lesson.type === 'text' ? (
                  <Field label="Lesson content (text)" error={lessonError?.content}>
                    <textarea
                      className={textareaFieldClass(Boolean(lessonError?.content))}
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
                ) : (
                  <FileUpload
                    label="Lesson video"
                    accept="video/*"
                    files={lesson.videoFiles}
                    existingUrl={lesson.existingVideoUrl}
                    error={lessonError?.video}
                    hint="Required for video lessons"
                    onChange={(files) =>
                      setLessons((prev) =>
                        prev.map((l) =>
                          l.id === lesson.id
                            ? {
                                ...l,
                                videoFiles: files,
                                existingVideoUrl: files.length ? null : l.existingVideoUrl,
                              }
                            : l,
                        ),
                      )
                    }
                  />
                )}
              </Card>
            )
          })}
        </div>

        <FileUpload
          label="Cover image"
          accept="image/*"
          files={coverFiles}
          existingUrl={existingCover}
          onChange={setCoverFiles}
        />

        <Button disabled={saving} onClick={() => void save()}>
          {saving
            ? isEdit
              ? 'Updating…'
              : 'Publishing…'
            : isEdit
              ? 'Update course'
              : isPublished
                ? 'Publish course'
                : 'Save draft'}
        </Button>
      </Card>
    </div>
  )
}
