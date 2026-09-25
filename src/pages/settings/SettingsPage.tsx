import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass } from '@/components/ui'

export default function SettingsPage() {
  const [taxPercent, setTaxPercent] = useState('0')
  const [commissionPercent, setCommissionPercent] = useState('0')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ taxPercent?: string; commissionPercent?: string }>({})

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
    const next: typeof errors = {}
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      next.taxPercent = 'Tax must be between 0 and 100%'
    }
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
      next.commissionPercent = 'Commission must be between 0 and 100%'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
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
        <Field label="Sales tax (%)" error={errors.taxPercent}>
          <input
            className={fieldClass(Boolean(errors.taxPercent))}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={taxPercent}
            onChange={(e) => {
              setTaxPercent(e.target.value)
              if (errors.taxPercent) setErrors((p) => ({ ...p, taxPercent: undefined }))
            }}
          />
        </Field>
        <Field label="App commission (%)" error={errors.commissionPercent}>
          <input
            className={fieldClass(Boolean(errors.commissionPercent))}
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={commissionPercent}
            onChange={(e) => {
              setCommissionPercent(e.target.value)
              if (errors.commissionPercent)
                setErrors((p) => ({ ...p, commissionPercent: undefined }))
            }}
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
