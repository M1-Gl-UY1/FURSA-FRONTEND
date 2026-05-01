import { useCallback, useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Upload, X } from 'lucide-react'

import { cn } from '@/lib/utils'

const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_PDF = ['application/pdf']
const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

export type FileKind = 'image' | 'pdf' | 'all'

type FileDropzoneProps = {
  files: File[]
  onChange: (files: File[]) => void
  /** Quels types accepter */
  kind?: FileKind
  /** Nombre max */
  maxFiles?: number
  /** Texte d'invite */
  hint?: string
}

export function FileDropzone({
  files,
  onChange,
  kind = 'image',
  maxFiles = 12,
  hint,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accepted = (() => {
    if (kind === 'image') return ACCEPTED_IMAGE
    if (kind === 'pdf') return ACCEPTED_PDF
    return [...ACCEPTED_IMAGE, ...ACCEPTED_PDF]
  })()

  const acceptStr = accepted.join(',')

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming)
      const errors: string[] = []
      const valid: File[] = []

      for (const f of arr) {
        if (!accepted.includes(f.type)) {
          errors.push(`${f.name} : type non supporté`)
          continue
        }
        if (f.size > MAX_BYTES) {
          errors.push(`${f.name} : trop volumineux (>10 MB)`)
          continue
        }
        valid.push(f)
      }

      const next = [...files, ...valid].slice(0, maxFiles)
      onChange(next)
      setError(errors.length ? errors.join(' · ') : null)
    },
    [accepted, files, maxFiles, onChange]
  )

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files)
    // Reset input pour permettre de resélectionner le même fichier
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {/* Zone drop */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors',
          dragActive
            ? 'border-terra bg-terra/5'
            : 'border-sand-400 bg-white hover:border-earth/30 hover:bg-sand-50'
        )}
      >
        <Upload
          className={cn(
            'w-10 h-10 mx-auto mb-3',
            dragActive ? 'text-terra' : 'text-earth-400'
          )}
          strokeWidth={1.5}
        />
        <p className="font-body font-semibold text-earth text-sm mb-1">
          Glissez-déposez ou cliquez pour parcourir
        </p>
        <p className="font-body text-earth-500 text-xs">
          {hint ??
            (kind === 'image'
              ? 'JPG, PNG, WEBP — max 10 MB'
              : kind === 'pdf'
                ? 'PDF — max 10 MB'
                : 'JPG, PNG, WEBP, PDF — max 10 MB')}{' '}
          · jusqu'à {maxFiles} fichiers
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          multiple
          onChange={onSelect}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-error text-xs font-body mt-2">{error}</p>
      )}

      {/* Preview */}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="bg-sand-100 border border-earth/8 rounded-md p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shrink-0 overflow-hidden">
                {f.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                ) : f.type === 'application/pdf' ? (
                  <FileText className="w-5 h-5 text-ocean" strokeWidth={1.75} />
                ) : (
                  <ImageIcon className="w-5 h-5 text-earth-500" strokeWidth={1.75} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-earth truncate">{f.name}</p>
                <p className="font-mono text-[11px] text-earth-500">
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Retirer ${f.name}`}
                className="w-8 h-8 rounded-md flex items-center justify-center text-earth-500 hover:bg-earth/8 hover:text-earth transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
