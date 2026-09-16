import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'

export default function BlogsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingBlogs()
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

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Blogs moderation"
        description="Approve, feature, and mark blogs as trending."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No pending blogs." />
      ) : (
        <div className="space-y-3">
          {rows.map((blog) => {
            const id = String(blog._id)
            const author = blog.businessUserId as Record<string, unknown> | undefined
            return (
              <Card key={id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{String(blog.title || 'Untitled')}</h3>
                      <Badge tone="warn">pending</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--haze-muted)]">
                      {String(author?.businessName || author?.fullName || author?.email || 'Author')}
                    </p>
                  </div>
                  {typeof blog.blogImage === 'string' ? (
                    <a href={blog.blogImage} target="_blank" rel="noreferrer" title="Open image">
                      <img
                        src={blog.blogImage}
                        alt=""
                        className="h-16 w-24 rounded-lg object-cover border border-[var(--haze-border)] hover:opacity-90"
                      />
                    </a>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--haze-muted)] line-clamp-3">
                  {String(blog.content || '')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void act(() => adminApi.approveBlog(id), 'Blog approved')}>
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void act(
                        () => adminApi.setBlogFlags(id, { isFeatured: true, isActive: true }),
                        'Marked featured',
                      )
                    }
                  >
                    Feature
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void act(
                        () => adminApi.setBlogFlags(id, { isTrending: true, isActive: true }),
                        'Marked trending',
                      )
                    }
                  >
                    Trending
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => void act(() => adminApi.rejectBlog(id), 'Blog rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
