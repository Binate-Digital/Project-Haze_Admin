import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, PageHeader, inputClass, textareaFieldClass } from '@/components/ui'
import {
  DataTable,
  FilterBar,
  FilterField,
  useClientPagination,
  type DataTableColumn,
} from '@/components/DataTable'

type Row = Record<string, unknown>

export default function StockDisputesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [resolution, setResolution] = useState('full_release')
  const [amount, setAmount] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [resolving, setResolving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listStockDisputes(status)
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

  const { pageRows, total, safePage } = useClientPagination(rows, page, pageSize)

  const openDetail = async (id: string) => {
    setSelectedId(id)
    try {
      const data = await adminApi.getStockDispute(id)
      setDetail(data as Record<string, unknown>)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const resolve = async () => {
    if (!selectedId) return
    setResolving(true)
    try {
      await adminApi.resolveStockDispute(selectedId, {
        resolution: resolution as 'full_release' | 'partial_release' | 'full_refund',
        amount: resolution === 'partial_release' ? Number(amount) : undefined,
        adminNote: adminNote.trim() || undefined,
      })
      toast.success('Dispute resolved')
      setDetail(null)
      setSelectedId(null)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setResolving(false)
    }
  }

  const columns: DataTableColumn<Row>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Request',
        render: (row) => (
          <div>
            <p className="font-medium">{String(row.productName || '—')}</p>
            <p className="text-xs text-[var(--haze-muted)]">
              ${Number(row.totalAmount || 0).toFixed(2)} · {String(row.paymentStatus || '')}
            </p>
          </div>
        ),
      },
      {
        key: 'parties',
        header: 'Parties',
        render: (row) => {
          const from = row.fromBusinessUserId as Row | undefined
          const to = row.toBusinessUserId as Row | undefined
          return (
            <div className="text-xs">
              <p>From: {String(from?.businessName || from?.fullName || '—')}</p>
              <p>To: {String(to?.businessName || to?.fullName || '—')}</p>
            </div>
          )
        },
      },
      {
        key: 'dispute',
        header: 'Dispute',
        render: (row) => {
          const d = row.dispute as Row | undefined
          return (
            <div>
              <Badge tone="warn">{String(d?.status || 'open')}</Badge>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--haze-muted)]">
                {String(d?.reason || '')}
              </p>
            </div>
          )
        },
      },
      {
        key: 'actions',
        header: '',
        render: (row) => (
          <Button type="button" variant="secondary" onClick={() => void openDetail(String(row._id))}>
            Review
          </Button>
        ),
      },
    ],
    [],
  )

  const stockRequest = detail?.stockRequest as Row | undefined
  const messages = (detail?.messages as Row[]) || []
  const contact = detail?.contactOutsideApp as {
    requester?: { email?: string; phone?: string }
    supplier?: { email?: string; phone?: string }
  } | undefined

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Stock disputes"
        description="Escrow disputes after delivery. View party chat, contact outside the app, release full/partial or refund."
      />

      <FilterBar>
        <FilterField label="Status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </FilterField>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={pageRows}
        loading={loading}
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(row) => String(row._id)}
      />

      {detail && stockRequest ? (
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{String(stockRequest.productName)}</h2>
              <p className="text-sm text-[var(--haze-muted)]">
                Total ${Number(stockRequest.totalAmount || 0).toFixed(2)} · Escrow{' '}
                {String(stockRequest.paymentStatus)}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="font-medium">Contact outside app</p>
              <p>Requester: {contact?.requester?.email || '—'} / {contact?.requester?.phone || '—'}</p>
              <p>Supplier: {contact?.supplier?.email || '—'} / {contact?.supplier?.phone || '—'}</p>
            </div>
            <div>
              <p className="font-medium">Dispute reason</p>
              <p className="text-[var(--haze-muted)]">
                {String((stockRequest.dispute as Row | undefined)?.reason || '—')}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium">Party chat ({messages.length})</p>
            <div className="max-h-64 overflow-auto rounded-lg border border-white/10 p-3 space-y-2 text-sm">
              {messages.length === 0 ? (
                <p className="text-[var(--haze-muted)]">No messages</p>
              ) : (
                messages.map((m) => {
                  const sender = m.senderId as Row | undefined
                  return (
                    <div key={String(m._id)} className="border-b border-white/5 pb-2">
                      <p className="text-xs text-[var(--haze-muted)]">
                        {String(sender?.businessName || sender?.fullName || 'User')} ·{' '}
                        {m.createdAt ? new Date(String(m.createdAt)).toLocaleString() : ''}
                      </p>
                      <p>{String(m.message || m.mediaUrl || '')}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-[var(--haze-muted)]">Resolution</label>
              <select
                className={inputClass}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              >
                <option value="full_release">Full release to supplier</option>
                <option value="partial_release">Partial release</option>
                <option value="full_refund">Full refund to requester</option>
              </select>
            </div>
            {resolution === 'partial_release' ? (
              <div>
                <label className="text-sm text-[var(--haze-muted)]">Amount (USD)</label>
                <input
                  className={inputClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-[var(--haze-muted)]">Admin note</label>
            <textarea
              className={textareaFieldClass(false)}
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
          <Button
            type="button"
            className="!bg-[#FFD700] !text-black hover:!bg-[#e6c200]"
            disabled={resolving}
            onClick={() => void resolve()}
          >
            {resolving ? 'Resolving…' : 'Resolve dispute'}
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
