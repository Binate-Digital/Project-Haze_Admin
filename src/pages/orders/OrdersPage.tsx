import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'

export default function OrdersPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState('succeeded')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listOrders({
        paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
      })
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus])

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & refunds"
        description="Review orders and issue Stripe refunds."
        actions={
          <>
            <select
              className="rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-3 py-2 text-sm"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="succeeded">paid</option>
              <option value="refunded">refunded</option>
              <option value="pending">payment pending</option>
              <option value="all">all</option>
            </select>
            <Button onClick={() => void load()}>Refresh</Button>
          </>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No orders found." />
      ) : (
        <div className="space-y-3">
          {rows.map((order) => {
            const id = String(order._id)
            const user = order.userId as Record<string, unknown> | undefined
            const store = order.businessStoreId as Record<string, unknown> | undefined
            const paid = order.paymentStatus === 'succeeded'
            return (
              <Card
                key={id}
                className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">
                      {String(order.orderNumber || id.slice(-6))}
                    </h3>
                    <Badge>{String(order.status)}</Badge>
                    <Badge tone={paid ? 'ok' : order.paymentStatus === 'refunded' ? 'bad' : 'warn'}>
                      {String(order.paymentStatus)}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--haze-muted)]">
                    {String(store?.storeName || 'Store')} · {String(user?.email || user?.fullName || 'Customer')} · $
                    {String(order.totalAmount ?? 0)}
                  </p>
                </div>
                {paid ? (
                  <Button variant="danger" onClick={() => void refund(id)}>
                    Refund
                  </Button>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
