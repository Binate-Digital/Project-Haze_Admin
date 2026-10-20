import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, PageHeader } from '@/components/ui'

type Item = Record<string, unknown>

export default function ScheduledContentPage() {
  const [blogs, setBlogs] = useState<Item[]>([])
  const [courses, setCourses] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listScheduledContent()
      setBlogs(Array.isArray(data?.blogs) ? data.blogs : [])
      setCourses(Array.isArray(data?.courses) ? data.courses : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const publishDue = async () => {
    try {
      const result = await adminApi.publishDueScheduledContent()
      toast.success(
        `Published ${result?.blogsPublished ?? 0} blogs, ${result?.coursesPublished ?? 0} courses`,
      )
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Scheduled content"
        description="Blogs and courses with a future publish time. Run publish-due to release anything past its schedule."
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
            <Button
              type="button"
              className="!bg-[#FFD700] !text-black hover:!bg-[#e6c200]"
              onClick={() => void publishDue()}
            >
              Publish due
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Blogs ({blogs.length})</h2>
            <ul className="mt-4 space-y-3">
              {blogs.length === 0 ? (
                <li className="text-sm text-[var(--haze-muted)]">No scheduled blogs</li>
              ) : (
                blogs.map((b) => (
                  <li key={String(b._id)} className="border-b border-white/10 pb-2">
                    <p className="font-medium">{String(b.title || '—')}</p>
                    <p className="text-xs text-[var(--haze-muted)]">
                      Publish at {b.publishAt ? new Date(String(b.publishAt)).toLocaleString() : '—'}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">Courses ({courses.length})</h2>
            <ul className="mt-4 space-y-3">
              {courses.length === 0 ? (
                <li className="text-sm text-[var(--haze-muted)]">No scheduled courses</li>
              ) : (
                courses.map((c) => (
                  <li key={String(c._id)} className="border-b border-white/10 pb-2">
                    <p className="font-medium">{String(c.title || '—')}</p>
                    <p className="text-xs text-[var(--haze-muted)]">
                      Publish at{' '}
                      {c.scheduledPublishAt
                        ? new Date(String(c.scheduledPublishAt)).toLocaleString()
                        : '—'}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
