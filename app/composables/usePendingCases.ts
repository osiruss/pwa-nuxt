import { ref, computed, type Ref } from 'vue'

export type MediaMeta = { sizeBytes: number; durationSec: number | null }

export function usePendingCases(args: {
  idbGetAll: () => Promise<any[]>
  idbPut: (doc: any) => Promise<any>
  idbDelete: (id: string) => Promise<any>
  now?: () => number
  autoSendAfterMs: number
}) {
  const now = args.now ?? (() => Date.now())

  const pending = ref<any[]>([])
  const mediaMeta = ref<Record<string, MediaMeta>>({})

  const pendingCount = computed(() => pending.value.length)
  const sortedPending = computed(() => [...pending.value].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)))

  function toPlainCase(item: any, patch?: Partial<any>) {
    return {
      id: item.id,
      rut: item.rut,
      createdAt: item.createdAt,
      mimeType: item.mimeType,
      chunks: Array.from(item.chunks ?? []),
      status: item.status,
      confirmedAt: item.confirmedAt ?? null,
      ...(patch || {})
    }
  }

  async function computeMetaForItem(item: any): Promise<MediaMeta> {
    const blob = new Blob(Array.from(item.chunks ?? []), { type: item.mimeType || 'video/webm' })
    const sizeBytes = blob.size

    const durationSec = await new Promise<number | null>((resolve) => {
      const url = URL.createObjectURL(blob)
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.muted = true

      const cleanup = () => {
        try {
          URL.revokeObjectURL(url)
        } catch {}
      }

      v.onloadedmetadata = () => {
        const d = Number.isFinite(v.duration) ? v.duration : null
        cleanup()
        resolve(d)
      }
      v.onerror = () => {
        cleanup()
        resolve(null)
      }

      v.src = url
    })

    return { sizeBytes, durationSec }
  }

  async function refreshPending() {
    const all = await args.idbGetAll()
    pending.value = all.filter((x: any) => x.status === 'review' || x.status === 'ready' || x.status === 'error')

    for (const item of pending.value) {
      if (mediaMeta.value[item.id]) continue
      computeMetaForItem(item)
        .then((meta) => (mediaMeta.value = { ...mediaMeta.value, [item.id]: meta }))
        .catch(() => (mediaMeta.value = { ...mediaMeta.value, [item.id]: { sizeBytes: 0, durationSec: null } }))
    }
  }

  async function replaceVideoOnItem(
    item: any,
    patch: { chunks: Blob[]; mimeType: string; keepConfirmedAt?: boolean }
  ) {
    const next = toPlainCase(item, {
      chunks: [...patch.chunks],
      mimeType: patch.mimeType,
      createdAt: now(),
      status: 'review',
      confirmedAt: patch.keepConfirmedAt ? item.confirmedAt ?? null : null
    })

    await args.idbPut(next)

    computeMetaForItem(next)
      .then((meta) => (mediaMeta.value = { ...mediaMeta.value, [next.id]: meta }))
      .catch(() => (mediaMeta.value = { ...mediaMeta.value, [next.id]: { sizeBytes: 0, durationSec: null } }))

    await refreshPending()
    return next
  }

  async function removePending(id: string) {
    await args.idbDelete(id)
    await refreshPending()
  }

  async function confirmToReady(item: any) {
    const updated = toPlainCase(item, { status: 'ready', confirmedAt: now() })
    await args.idbPut(updated)
    await refreshPending()
    return updated
  }

  function isReadyExpired(item: any) {
    if (item.status !== 'ready') return false
    const t = Number(item.confirmedAt ?? 0)
    if (!t) return false
    return now() - t >= args.autoSendAfterMs
  }

  const readyExpiredCount = computed(() => pending.value.filter(isReadyExpired).length)

  function remainingText(item: any) {
    if (item.status !== 'ready' || !item.confirmedAt) return '-'
    const remaining = args.autoSendAfterMs - (now() - Number(item.confirmedAt))
    if (remaining <= 0) return 'vencido (se enviará cuando esté online)'
    const mins = Math.floor(remaining / 60000)
    const secs = Math.floor((remaining % 60000) / 1000)
    return `${mins}m ${secs}s`
  }

  return {
    pending,
    mediaMeta,
    pendingCount,
    sortedPending,

    toPlainCase,
    computeMetaForItem,
    refreshPending,
    replaceVideoOnItem,
    removePending,
    confirmToReady,

    isReadyExpired,
    readyExpiredCount,
    remainingText
  }
}