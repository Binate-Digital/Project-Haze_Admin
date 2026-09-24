import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, inputClass } from '@/components/ui'

export default function SettingsPage() {
  const [taxPercent, setTaxPercent] = useState('0')
  const [commissionPercent, setCommissionPercent] = useState('0')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPlatformSettings()
      setTaxPercent(String(data.taxPercent ?? 0))
      setCommissionPercent(String(data.commissionPercent ?? 0))
      setUpdatedAt(data.updatedAt ? String(data.updatedAt) : null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    const tax = Number(taxPercent)
    const commission = Number(commissionPercent)
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      toast.error('Tax must be between 0 and 100%')
      return
    }
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      toast.error('Commission must be between 0 and 100%')
      return
    }
    setSaving(true)
    try {
      const data = await adminApi.updatePlatformSettings({
        taxPercent: tax,
        commissionPercent: commission,
      })
      setTaxPercent(String(data.taxPercent ?? tax))
      setCommissionPercent(String(data.commissionPercent ?? commission))
      setUpdatedAt(data.updatedAt ? String(data.updatedAt) : null)
      toast.success('Platform settings saved')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-[var(--haze-muted)]">Loading…</p>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Tax & commission"
        description="Applied on checkout (tax) and store payouts (app commission). Values are percentages."
      />
      <Card className="space-y-4">
        <Field label="Sales tax (%)">
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
          />
        </Field>
        <Field label="App commission (%)">
          <input
            className={inputClass}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
          />
        </Field>
        {updatedAt ? (
          <p className="text-xs text-[var(--haze-muted)]">
            Last updated: {new Date(updatedAt).toLocaleString()}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
          <Button variant="ghost" disabled={saving} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  )
}
