import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import type { AdminUser } from '@/types/auth'
import {
  Button,
  Card,
  Field,
  PageHeader,
  inputClass,
  textareaClass,
} from '@/components/ui'

export default function ProfilePage() {
  const setUser = useAuthStore((s) => s.setUser)
  const storedUser = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [bio, setBio] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [apartment, setApartment] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [email, setEmail] = useState('')

  const applyProfile = (profile: Record<string, unknown> | AdminUser) => {
    const address = (profile.address || {}) as Record<string, string>
    setFullName(String(profile.fullName || ''))
    setPhoneNumber(String(profile.phoneNumber || ''))
    setBio(String(profile.bio || ''))
    setEmail(String(profile.email || ''))
    setStreetAddress(String(address.streetAddress || ''))
    setCity(String(address.city || ''))
    setState(String(address.state || ''))
    setZipCode(String(address.zipCode || ''))
    setApartment(String(address.apartmentSuiteFloor || ''))
    setPreview(typeof profile.userImg === 'string' ? profile.userImg : null)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const profile = await adminApi.getProfile()
        if (!alive) return
        applyProfile(profile)
        setUser(profile as AdminUser)
      } catch (error) {
        if (storedUser) applyProfile(storedUser)
        toast.error(getApiErrorMessage(error, 'Could not load profile'))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPickImage = (file: File | null) => {
    setImageFile(file)
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const form = new FormData()
      form.append('fullName', fullName.trim())
      form.append('phoneNumber', phoneNumber.trim())
      form.append('bio', bio.trim())
      form.append(
        'address',
        JSON.stringify({
          streetAddress: streetAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          apartmentSuiteFloor: apartment.trim(),
        }),
      )
      if (imageFile) form.append('userImg', imageFile)

      const updated = await adminApi.updateProfile(form)
      setUser(updated as AdminUser)
      applyProfile(updated)
      setImageFile(null)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[var(--haze-muted)]">Loading profile…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Admin profile"
        description="Update your name, contact details, address, and profile image."
      />

      <Card className="space-y-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {preview ? (
            <img
              src={preview}
              alt=""
              className="h-20 w-20 rounded-full object-cover border border-[var(--haze-border)]"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--haze-accent)]/15 text-sm text-[var(--haze-muted)]">
              No photo
            </div>
          )}
          <Field label="Profile image">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0] || null)}
            />
          </Field>
        </div>

        <Field label="Email">
          <input className={inputClass} value={email} disabled />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Bio">
          <textarea
            className={textareaClass}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Street address">
            <input
              className={inputClass}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
          </Field>
          <Field label="Apartment / suite">
            <input
              className={inputClass}
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
            />
          </Field>
          <Field label="City">
            <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="State">
            <input
              className={inputClass}
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </Field>
          <Field label="Zip code">
            <input
              className={inputClass}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />
          </Field>
        </div>

        <Button disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </Card>
    </div>
  )
}
