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

export default function OrdersPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState('succeeded')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listOrders({
        paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
        status: status === 'all' ? undefined : status,
      })
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
  }, [paymentStatus, status])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const needle = q.trim().toLowerCase()
    return rows.filter((order) => {
      const user = order.userId as Record<string, unknown> | undefined
      const store = order.businessStoreId as Record<string, unknown> | undefined
      return `${order.orderNumber || ''} ${user?.email || ''} ${store?.storeName || ''}`
        .toLowerCase()
        .includes(needle)
    })
  }, [rows, q])

  const { pageRows, total, safePage } = useClientPagination(filtered, page, pageSize)

  const refund = async (orderId: string) => {
    if (!window.confirm('Refund this order via Stripe?')) return
    const reason = window.prompt('Refund reason (optional)') || undefined
    try {
      await adminApi.refundOrder(orderId, reason)
      toast.success('Order refunded')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (order) => String(order.orderNumber || String(order._id).slice(-6)),
    },
    {
      key: 'store',
      header: 'Store',
      render: (order) => {
        const store = order.businessStoreId as Record<string, unknown> | undefined
        return String(store?.storeName || '—')
      },
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => {
        const user = order.userId as Record<string, unknown> | undefined
        return String(user?.email || user?.fullName || '—')
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (order) => `$${String(order.totalAmount ?? 0)}`,
    },
    {
      key: 'fulfillment',
      header: 'Fulfillment',
      render: (order) => <Badge>{String(order.status)}</Badge>,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order) => {
        const paid = order.paymentStatus === 'succeeded'
        return (
          <Badge tone={paid ? 'ok' : order.paymentStatus === 'refunded' ? 'bad' : 'warn'}>
            {String(order.paymentStatus)}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (order) =>
        order.paymentStatus === 'succeeded' ? (
          <Button variant="danger" onClick={() => void refund(String(order._id))}>
            Refund
          </Button>
        ) : (
          <span className="text-[var(--haze-muted)]">—</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Orders & refunds"
        description="Orders listing with payment filters."
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      <FilterBar>
        <FilterField label="Payment">
          <select
            className={inputClass}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="succeeded">paid</option>
            <option value="refunded">refunded</option>
            <option value="pending">payment pending</option>
            <option value="all">all</option>
          </select>
        </FilterField>
        <FilterField label="Fulfillment">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">pending</option>
            <option value="accepted">accepted</option>
            <option value="ready_for_pickup">ready_for_pickup</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="rejected">rejected</option>
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
            placeholder="order #, email, store"
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
        emptyMessage="No orders found."
      />
    </div>
  )
}
