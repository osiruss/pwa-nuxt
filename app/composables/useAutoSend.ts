import { onBeforeUnmount, type Ref } from 'vue'

export function useAutoSend(args: {
  pending: Ref<any[]>
  autoSendAfterMs: number
  autoCheckEveryMs: number
  syncReadyExpired: () => Promise<void> | void
  now?: () => number
}) {
  const now = args.now ?? (() => Date.now())

  let autoTimer: ReturnType<typeof setInterval> | null = null
  const autoTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

  function scheduleAutoSend(item: any) {
    if (!item || item.status !== 'ready') return
    const confirmedAt = Number(item.confirmedAt || 0)
    if (!confirmedAt) return

    const prev = autoTimeouts.get(item.id)
    if (prev) clearTimeout(prev)

    const dueIn = Math.max(0, args.autoSendAfterMs - (now() - confirmedAt))
    const t = setTimeout(async () => {
      await args.syncReadyExpired()
    }, dueIn)

    autoTimeouts.set(item.id, t)
  }

  function scheduleForExisting() {
    for (const item of args.pending.value as any[]) scheduleAutoSend(item)
  }

  function startInterval() {
    if (autoTimer) return
    autoTimer = setInterval(() => {
      args.syncReadyExpired()
    }, args.autoCheckEveryMs)
  }

  function stop() {
    if (autoTimer) clearInterval(autoTimer)
    autoTimer = null

    for (const t of autoTimeouts.values()) clearTimeout(t)
    autoTimeouts.clear()
  }

  function init() {
    scheduleForExisting()
    startInterval()
  }

  onBeforeUnmount(() => {
    stop()
  })

  return {
    scheduleAutoSend,
    scheduleForExisting,
    startInterval,
    stop,
    init
  }
}