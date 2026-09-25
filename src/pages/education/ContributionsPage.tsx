import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, PageHeader, inputClass } from '@/components/ui'
import {
  DataTable,
  FilterBar,
  FilterField,
  useClientPagination,
  type DataTableColumn,
} from '@/components/DataTable'
import { ROUTES } from '@/config'

type Row = Record<string, unknown>

export default function ContributionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<Row | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getContributions(status === 'all' ? undefined : status)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (type !== 'all' && String(row.type) !== type) return false
      if (!q.trim()) return true
      const biz = row.businessUserId as Record<string, unknown> | undefined
      const hay = `${row.title || ''} ${row.description || ''} ${biz?.businessName || ''} ${biz?.email || ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [rows, q, type])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const review = async (id: string, action: 'approve' | 'reject') => {
    let reason: string | undefined
    if (action === 'reject') {
      reason = window.prompt('Reject reason (optional)') || undefined
    }
    try {
      await adminApi.reviewContribution(id, action, reason)
      toast.success(`Contribution ${action}d`)
      setDetail(null)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const openDetail = async (id: string) => {
    try {
      const data = await adminApi.getContribution(id)
      setDetail(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'title',
      header: 'Contribution',
      render: (row) => {
        const biz = row.businessUserId as Record<string, unknown> | undefined
        return (
          <div>
            <p className="font-medium">{String(row.title)}</p>
            <p className="text-xs text-[var(--haze-muted)]">
              {String(biz?.businessName || biz?.email || '')}
            </p>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone="warn">{String(row.type)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = String(row.status || 'pending')
        const tone = s === 'approved' ? 'ok' : s === 'rejected' ? 'bad' : 'warn'
        return <Badge tone={tone}>{s}</Badge>
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <p className="max-w-sm line-clamp-2 text-[var(--haze-muted)]">
          {String(row.description || '')}
        </p>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void openDetail(String(row._id))}>
            Detail
          </Button>
          {row.status === 'pending' || !row.status ? (
            <>
              <Button onClick={() => void review(String(row._id), 'approve')}>Approve</Button>
              <Button variant="danger" onClick={() => void review(String(row._id), 'reject')}>
                Reject
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ]

  const detailLessons = Array.isArray(detail?.lessons) ? (detail?.lessons as Row[]) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Education contributions"
        description="Review business Article / Host / Sponsor submissions. Approve runs the product hooks."
        actions={
          <>
            <Link to={ROUTES.EDUCATION}>
              <Button variant="ghost">Courses</Button>
            </Link>
            <Button variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
          </>
        }
      />

      <FilterBar>
        <FilterField label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </FilterField>
        <FilterField label="Type">
          <select
            className={inputClass}
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="article">article</option>
            <option value="host_course">host_course</option>
            <option value="sponsor_course">sponsor_course</option>
          </select>
        </FilterField>
        <FilterField label="Search" className="min-w-[220px] flex-[2]">
          <input
            className={inputClass}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            placeholder="title, business, description"
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
        emptyMessage="No contributions."
      />

      {detail ? (
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{String(detail.title)}</h3>
              <p className="text-sm text-[var(--haze-muted)]">
                {String(detail.type)} · {String(detail.status)}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{String(detail.description || '')}</p>
          {detail.courseId ? (
            <p className="text-xs text-[var(--haze-muted)]">
              Linked course: {String((detail.courseId as Row)?.title || detail.courseId)}
            </p>
          ) : null}
          {detail.createdBlogId ? (
            <p className="text-xs text-[var(--haze-neon)]">
              Created blog: {String((detail.createdBlogId as Row)?._id || detail.createdBlogId)}
            </p>
          ) : null}
          {detail.createdCourseId ? (
            <p className="text-xs text-[var(--haze-neon)]">
              Created course:{' '}
              {String((detail.createdCourseId as Row)?.title || detail.createdCourseId)}
            </p>
          ) : null}
          {detailLessons.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Lessons draft</p>
              {detailLessons.map((lesson, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--haze-border)] px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {String(lesson.title)}{' '}
                    <Badge tone="neutral">{String(lesson.type || 'text')}</Badge>
                  </p>
                  {lesson.type === 'video' ? (
                    lesson.videoUrl ? (
                      <a
                        href={String(lesson.videoUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--haze-accent)] hover:underline"
                      >
                        Open video
                      </a>
                    ) : (
                      <p className="text-xs text-[var(--haze-muted)]">No video URL</p>
                    )
                  ) : (
                    <p className="text-xs text-[var(--haze-muted)] line-clamp-3">
                      {String(lesson.content || '')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {detail.status === 'pending' ? (
            <div className="flex gap-2">
              <Button onClick={() => void review(String(detail._id), 'approve')}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => void review(String(detail._id), 'reject')}>
                Reject
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
