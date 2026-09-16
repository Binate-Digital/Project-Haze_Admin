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
  FileUpload,
  MediaPreviewCard,
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
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
    setExistingImage(typeof profile.userImg === 'string' ? profile.userImg : null)
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
      if (imageFiles[0]) form.append('userImg', imageFiles[0])

      const updated = await adminApi.updateProfile(form)
      setUser(updated as AdminUser)
      applyProfile(updated)
      setImageFiles([])
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
        {existingImage && imageFiles.length === 0 ? (
          <MediaPreviewCard label="Current profile image" url={existingImage} />
        ) : null}

        <FileUpload
          label="Profile image"
          accept="image/*"
          files={imageFiles}
          onChange={setImageFiles}
        />

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
