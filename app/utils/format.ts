// utils/format.ts
export function formatBytes(bytes: number) {
  const kb = 1024
  const mb = kb * 1024
  const gb = mb * 1024
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`
  if (bytes >= kb) return `${(bytes / kb).toFixed(1)} KB`
  return `${bytes} B`
}

export function formatDuration(sec: number | null) {
  if (sec == null || !Number.isFinite(sec)) return '-'
  const s = Math.floor(sec)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString('es-CL')
  } catch {
    return String(ts)
  }
}

export function badgeStyle(s: any) {
  const base =
    'padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase;'
  if (s === 'review') return base + ' background:#e3f2fd; color:#0d47a1; border:1px solid #bbdefb;'
  if (s === 'ready') return base + ' background:#fff3cd; color:#856404; border:1px solid #ffe8a1;'
  if (s === 'error') return base + ' background:#ffe5e5; color:#b00020; border:1px solid #ffb3b3;'
  return base + ' background:#f5f5f5; color:#333; border:1px solid #ddd;'
}