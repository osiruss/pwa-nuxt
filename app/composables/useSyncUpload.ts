import { type Ref } from 'vue'

export function useSyncUpload(args: {
  online: Ref<boolean>
  syncing: Ref<boolean>

  pending: Ref<any[]>
  refreshPending: () => Promise<void>
  toPlainCase: (item: any, patch?: Partial<any>) => any
  isReadyExpired: (item: any) => boolean

  idbPut: (doc: any) => Promise<any>
  idbDelete: (id: string) => Promise<any>


  setMsg: (t: string) => void
  shouldResetAfterSync: () => boolean
  resetToStartAfterDelay: (ms?: number) => void


  uploadCase: (item: any) => Promise<void>
}) {
  async function syncOne(item: any) {
    if (!args.online.value) return args.setMsg('OFFLINE (ping). No se puede subir.')
    if (item.status !== 'ready') return args.setMsg('Debes CONFIRMAR el video antes de subir.')
    if (args.syncing.value) return

    args.syncing.value = true
    try {
      args.setMsg(`Subiendo caso ${item.id} (RUT ${item.rut})...`)
      await args.uploadCase(item)
      await args.idbDelete(item.id)
      await args.refreshPending()
      args.setMsg(`Subido OK y eliminado local: ${item.id}`)
      if (args.shouldResetAfterSync()) args.resetToStartAfterDelay()
    } catch (e: any) {
      await args.idbPut(args.toPlainCase(item, { status: 'error' }))
      await args.refreshPending()
      args.setMsg(`Error subiendo ${item.id}: ${e?.message ?? e}`)
    } finally {
      args.syncing.value = false
    }
  }

  async function syncPending() {
    if (!args.online.value) return args.setMsg('OFFLINE (ping). No se puede sincronizar.')
    if (args.syncing.value) return

    args.syncing.value = true
    try {
      await args.refreshPending()
      const ready = args.pending.value.filter((x: any) => x.status === 'ready')
      if (ready.length === 0) return args.setMsg('No hay confirmados listos para enviar.')

      for (const item of [...ready]) {
        try {
          args.setMsg(`Subiendo confirmado ${item.id}...`)
          await args.uploadCase(item)
          await args.idbDelete(item.id)
        } catch (e: any) {
          await args.idbPut(args.toPlainCase(item, { status: 'error' }))
          args.setMsg(`Error subiendo ${item.id}: ${e?.message ?? e}`)
        }
      }

      await args.refreshPending()
      args.setMsg('Envío manual terminado.')
      if (args.shouldResetAfterSync()) args.resetToStartAfterDelay()
    } finally {
      args.syncing.value = false
    }
  }

  async function syncReadyExpired() {
    if (!args.online.value) return
    if (args.syncing.value) return

    await args.refreshPending()
    const expired = args.pending.value.filter((x: any) => args.isReadyExpired(x))
    if (expired.length === 0) return

    args.syncing.value = true
    try {
      for (const item of [...expired]) {
        try {
          args.setMsg(`(Auto) Subiendo confirmado ${item.id}...`)
          await args.uploadCase(item)
          await args.idbDelete(item.id)
        } catch (e: any) {
          await args.idbPut(args.toPlainCase(item, { status: 'error' }))
          args.setMsg(`(Auto) Error subiendo ${item.id}: ${e?.message ?? e}`)
        }
      }
      await args.refreshPending()
      args.setMsg('(Auto) Envío automático terminado.')
    } finally {
      args.syncing.value = false
    }
  }

  return {
    syncOne,
    syncPending,
    syncReadyExpired
  }
}