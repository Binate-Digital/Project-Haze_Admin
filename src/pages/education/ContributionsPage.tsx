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

function typeLabel(row: Row): string {
  const t = String(row.type || '')
  if (t === 'article') return 'Article'
  if (t === 'sponsor_course') return 'Sponsor'
  if (t === 'host_course') {
    return row.courseId ? 'Host — Existing course' : 'Host — New course'
  }
  return t
}

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
      // Always send status so "all" is not treated as default pending by the API
      const data = await adminApi.getContributions(status || 'pending')
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
      const entered = window.prompt('Reject reason (required)')
      if (entered === null) return
      reason = entered.trim()
      if (!reason) {
        toast.error('Reject reason is required')
        return
      }
    } else if (!window.confirm('Approve this contribution? Side-effects will go live.')) {
      return
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
      render: (row) => <Badge tone="warn">{typeLabel(row)}</Badge>,
    },
    {
      key: 'related',
      header: 'Related course',
      render: (row) => {
        const course = row.courseId as Row | undefined
        const name = course?.title || ''
        const lessons = Array.isArray(row.lessons) ? row.lessons.length : 0
        if (!name && !lessons) return <span className="text-[var(--haze-muted)]">—</span>
        return (
          <div className="text-xs text-[var(--haze-muted)]">
            {name ? <p>{String(name)}</p> : null}
            {lessons ? <p>{lessons} lesson(s)</p> : null}
          </div>
        )
      },
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
      key: 'createdAt',
      header: 'Submitted',
      render: (row) => (
        <span className="text-xs text-[var(--haze-muted)]">
          {row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'}
        </span>
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
  const detailBiz = detail?.businessUserId as Row | undefined
  const rejectReason = String(detail?.rejectReason || detail?.adminNote || '')

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
            <option value="article">Article</option>
            <option value="host_course">Host course</option>
            <option value="sponsor_course">Sponsor</option>
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
                {typeLabel(detail)} · {String(detail.status)}
                {detail.createdAt
                  ? ` · ${new Date(String(detail.createdAt)).toLocaleString()}`
                  : ''}
              </p>
              {detailBiz ? (
                <p className="mt-1 text-xs text-[var(--haze-muted)]">
                  Business: {String(detailBiz.businessName || detailBiz.fullName || '')}
                  {detailBiz.businessUserName ? ` (@${String(detailBiz.businessUserName)})` : ''}
                  {detailBiz.email ? ` · ${String(detailBiz.email)}` : ''}
                </p>
              ) : null}
            </div>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{String(detail.description || '')}</p>
          {detail.attachmentUrl ? (
            <p className="text-sm">
              Attachment:{' '}
              <a
                href={String(detail.attachmentUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--haze-accent)] hover:underline"
              >
                Open / download
              </a>
            </p>
          ) : null}
          {detail.courseId ? (
            <p className="text-xs text-[var(--haze-muted)]">
              Linked course: {String((detail.courseId as Row)?.title || detail.courseId)}
              {(detail.courseId as Row)?._id ? (
                <>
                  {' · '}
                  <Link
                    to={ROUTES.EDUCATION_EDIT.replace(
                      ':courseId',
                      String((detail.courseId as Row)._id),
                    )}
                    className="text-[var(--haze-accent)] hover:underline"
                  >
                    Open in CMS
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          {detail.createdBlogId ? (
            <p className="text-xs text-[var(--haze-neon)]">
              Created blog:{' '}
              <Link
                to={ROUTES.BLOGS_EDIT.replace(
                  ':blogId',
                  String((detail.createdBlogId as Row)?._id || detail.createdBlogId),
                )}
                className="hover:underline"
              >
                {String((detail.createdBlogId as Row)?._id || detail.createdBlogId)}
              </Link>
            </p>
          ) : null}
          {detail.createdCourseId ? (
            <p className="text-xs text-[var(--haze-neon)]">
              Created course:{' '}
              <Link
                to={ROUTES.EDUCATION_EDIT.replace(
                  ':courseId',
                  String((detail.createdCourseId as Row)?._id || detail.createdCourseId),
                )}
                className="hover:underline"
              >
                {String((detail.createdCourseId as Row)?.title || detail.createdCourseId)}
              </Link>
            </p>
          ) : null}
          {String(detail.status) === 'rejected' && rejectReason ? (
            <p className="rounded-xl border border-[var(--haze-border)] bg-[var(--haze-surface)] px-3 py-2 text-sm text-red-600">
              Reject reason: {rejectReason}
            </p>
          ) : null}
          {detailLessons.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Lessons draft ({detailLessons.length})</p>
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
