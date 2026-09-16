import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { ROUTES } from '@/config'

type Row = Record<string, unknown>

export default function EducationPage() {
  const [courses, setCourses] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [published, setPublished] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listCourses()
      setCourses(Array.isArray(data) ? data : [])
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
    return courses.filter((course) => {
      if (published === 'yes' && !course.isPublished) return false
      if (published === 'no' && course.isPublished) return false
      if (!q.trim()) return true
      const hay = `${course.title || ''} ${course.topic || ''} ${course.category || ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [courses, published, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const togglePublish = async (course: Row) => {
    try {
      const form = new FormData()
      form.append('isPublished', String(!(course.isPublished === true)))
      await adminApi.updateCourse(String(course._id), form)
      toast.success(course.isPublished ? 'Course unpublished' : 'Course published')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const removeCourse = async (courseId: string) => {
    if (!window.confirm('Delete this course?')) return
    try {
      await adminApi.deleteCourse(courseId)
      toast.success('Course deleted')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'title',
      header: 'Course',
      render: (row) => (
        <div>
          <p className="font-medium">{String(row.title)}</p>
          <p className="text-xs text-[var(--haze-muted)]">
            {String(row.topic || row.category || 'No topic')}
          </p>
        </div>
      ),
    },
    {
      key: 'lessons',
      header: 'Lessons',
      render: (row) => String(row.totalLessons || 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.isPublished ? <Badge tone="ok">published</Badge> : <Badge tone="warn">draft</Badge>,
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (row) => (row.isTrending ? <Badge>trending</Badge> : <span className="text-[var(--haze-muted)]">—</span>),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void togglePublish(row)}>
            {row.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="danger" onClick={() => void removeCourse(String(row._id))}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Education courses"
        description="Manage published courses."
        actions={
          <>
            <Link to={ROUTES.EDUCATION_CONTRIBUTIONS}>
              <Button variant="ghost">Contributions</Button>
            </Link>
            <Button variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
            <Link to={ROUTES.EDUCATION_CREATE}>
              <Button>Create course</Button>
            </Link>
          </>
        }
      />

      <FilterBar>
        <FilterField label="Published">
          <select
            className={inputClass}
            value={published}
            onChange={(e) => {
              setPublished(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All</option>
            <option value="yes">Published</option>
            <option value="no">Draft</option>
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
            placeholder="title or topic"
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
      />
    </div>
  )
}
