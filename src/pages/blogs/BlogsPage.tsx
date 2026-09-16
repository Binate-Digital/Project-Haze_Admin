import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, PageHeader, inputClass } from '@/components/ui'
import {
  DataTable,
  FilterBar,
  FilterField,
  useClientPagination,
  type DataTableColumn,
} from '@/components/DataTable'

type Row = Record<string, unknown>

export default function BlogsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingBlogs()
      setRows(Array.isArray(data) ? data : [])
      setPage(1)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const needle = q.trim().toLowerCase()
    return rows.filter((blog) => {
      const author = blog.businessUserId as Record<string, unknown> | undefined
      return `${blog.title || ''} ${blog.content || ''} ${author?.businessName || ''} ${author?.email || ''}`
        .toLowerCase()
        .includes(needle)
    })
  }, [rows, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'blog',
      header: 'Blog',
      render: (blog) => {
        const author = blog.businessUserId as Record<string, unknown> | undefined
        return (
          <div className="flex items-start gap-3">
            {typeof blog.blogImage === 'string' ? (
              <a href={blog.blogImage} target="_blank" rel="noreferrer">
                <img
                  src={blog.blogImage}
                  alt=""
                  className="h-12 w-16 rounded-lg object-cover border border-[var(--haze-border)]"
                />
              </a>
            ) : null}
            <div>
              <p className="font-medium">{String(blog.title || 'Untitled')}</p>
              <p className="text-xs text-[var(--haze-muted)]">
                {String(author?.businessName || author?.fullName || author?.email || 'Author')}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge tone="warn">pending</Badge>,
    },
    {
      key: 'preview',
      header: 'Preview',
      render: (blog) => (
        <p className="max-w-sm line-clamp-2 text-[var(--haze-muted)]">{String(blog.content || '')}</p>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (blog) => {
        const id = String(blog._id)
        return (
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
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Blogs moderation"
        description="Pending blogs awaiting review."
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <FilterBar>
        <FilterField label="Search" className="min-w-[220px] flex-[2]">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="title, author, content"
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={pageRows}
        loading={loading}
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        rowKey={(row) => String(row._id)}
        emptyMessage="No pending blogs."
      />
    </div>
  )
}
