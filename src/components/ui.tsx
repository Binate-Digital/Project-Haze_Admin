import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--haze-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2 flex-wrap">{actions}</div> : null}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--haze-border)] bg-[var(--haze-panel)] p-5 ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-[var(--haze-accent)] text-[#102012] hover:opacity-90',
    secondary: 'bg-[var(--haze-accent-2)]/20 text-[var(--haze-accent-2)] hover:bg-[var(--haze-accent-2)]/30',
    ghost: 'border border-[var(--haze-border)] hover:bg-white/5',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'ok' | 'warn' | 'bad'
}) {
  const map = {
    neutral: 'bg-white/10 text-[var(--haze-muted)]',
    ok: 'bg-[var(--haze-accent)]/15 text-[var(--haze-accent)]',
    warn: 'bg-[var(--haze-accent-2)]/15 text-[var(--haze-accent-2)]',
    bad: 'bg-red-500/15 text-red-300',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--haze-border)] p-10 text-center text-sm text-[var(--haze-muted)]">
      {message}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[var(--haze-muted)]">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--haze-accent)]'

export const textareaClass = `${inputClass} min-h-28 resize-y`

export type MediaKind = 'image' | 'pdf' | 'word' | 'excel' | 'file'

export function getMediaKind(nameOrUrl: string, mime?: string): MediaKind {
  const value = `${mime || ''} ${nameOrUrl}`.toLowerCase()
  if (
    value.includes('image/') ||
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(nameOrUrl)
  ) {
    return 'image'
  }
  if (value.includes('pdf') || /\.pdf(\?|$)/i.test(nameOrUrl)) return 'pdf'
  if (
    value.includes('word') ||
    value.includes('msword') ||
    value.includes('officedocument.wordprocessing') ||
    /\.(doc|docx)(\?|$)/i.test(nameOrUrl)
  ) {
    return 'word'
  }
  if (
    value.includes('excel') ||
    value.includes('spreadsheet') ||
    /\.(xls|xlsx|csv)(\?|$)/i.test(nameOrUrl)
  ) {
    return 'excel'
  }
  return 'file'
}

function fileNameFromUrl(url: string) {
  try {
    const path = decodeURIComponent(new URL(url).pathname)
    return path.split('/').filter(Boolean).pop() || 'Document'
  } catch {
    return url.split('/').pop() || 'Document'
  }
}

function MediaIcon({ kind }: { kind: MediaKind }) {
  if (kind === 'pdf') return <FileText className="h-8 w-8 text-red-300" />
  if (kind === 'word') return <FileType className="h-8 w-8 text-sky-300" />
  if (kind === 'excel') return <FileSpreadsheet className="h-8 w-8 text-emerald-300" />
  if (kind === 'image') return <ImageIcon className="h-8 w-8 text-[var(--haze-accent)]" />
  return <FileText className="h-8 w-8 text-[var(--haze-muted)]" />
}

export function MediaPreviewCard({
  label,
  url,
  file,
  onRemove,
}: {
  label?: string
  url?: string | null
  file?: File | null
  onRemove?: () => void
}) {
  const [src, setSrc] = useState('')
  const name = file?.name || (url ? fileNameFromUrl(url) : 'File')
  const kind = getMediaKind(name, file?.type)

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setSrc(objectUrl)
      return () => {
        URL.revokeObjectURL(objectUrl)
      }
    }
    setSrc(url || '')
  }, [file, url])

  if (!file && !url) return null
  if (!src) {
    return (
      <div className="rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-4 py-8 text-center text-sm text-[var(--haze-muted)]">
        Loading preview…
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)]">
      {label || onRemove ? (
        <div className="flex items-center justify-between border-b border-[var(--haze-border)] px-3 py-2">
          <p className="text-xs text-[var(--haze-muted)]">{label || name}</p>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg p-1 text-[var(--haze-muted)] hover:bg-white/5 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {kind === 'image' ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          title="Open in new tab"
        >
          <img
            src={src}
            alt={name}
            className="h-44 w-full bg-black/20 object-contain hover:opacity-95"
          />
        </a>
      ) : (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-5 hover:bg-white/5"
          title="Open in new tab"
        >
          <MediaIcon kind={kind} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs uppercase text-[var(--haze-muted)]">{kind} · click to open</p>
          </div>
        </a>
      )}

      {kind === 'image' ? (
        <div className="border-t border-[var(--haze-border)] px-3 py-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-[var(--haze-accent)] hover:underline"
            title="Open in new tab"
          >
            {name}
          </a>
        </div>
      ) : null}
    </div>
  )
}

export function FileUpload({
  label,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  multiple = false,
  files,
  onChange,
  hint,
}: {
  label: string
  accept?: string
  multiple?: boolean
  files: File[]
  onChange: (files: File[]) => void
  hint?: string
}) {
  const inputId = useId()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--haze-muted)]">{label}</span>
        {hint ? <span className="text-xs text-[var(--haze-muted)]">{hint}</span> : null}
      </div>

      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--haze-border)] bg-[var(--haze-bg)] px-4 py-8 text-center transition hover:border-[var(--haze-accent)]/50 hover:bg-white/[0.02]"
      >
        <Upload className="h-5 w-5 text-[var(--haze-accent)]" />
        <span className="text-sm">
          Click to upload {multiple ? 'files' : 'a file'}
        </span>
        <span className="text-xs text-[var(--haze-muted)]">
          Images, PDF, Word, or Excel
        </span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            const list = Array.from(e.target.files || [])
            onChange(multiple ? [...files, ...list] : list.slice(0, 1))
            e.target.value = ''
          }}
        />
      </label>

      {files.length > 0 ? (
        <div className={`grid gap-3 ${multiple ? 'sm:grid-cols-2' : ''}`}>
          {files.map((file, index) => (
            <MediaPreviewCard
              key={`${file.name}-${file.lastModified}-${file.size}-${index}`}
              file={file}
              onRemove={() => onChange(files.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
