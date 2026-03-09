<template>
  <NuxtPwaManifest />
  <ClientOnly>
    <UApp>
      <NuxtPage />
    </UApp>
    <template #fallback>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { idbGetAll, idbDelete, type StoredCase } from '~/utils/idb'

const pendingOpen = ref(false)
const syncing = ref(false)

function handlePendingChanged() {
  if (process.client) {
    window.dispatchEvent(new Event('cases:changed'))
  }
}

async function uploadCase(item: StoredCase) {
  const blob = new Blob(item.chunks, { type: item.mimeType })

  const fd = new FormData()
  fd.append('rut', item.rut)
  fd.append('createdAt', String(item.createdAt))
  fd.append('video', blob, `${item.rut}-${item.createdAt}.webm`)

  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`Upload falló: ${res.status}`)
}

async function syncPending() {
  if (!process.client) return
  if (!navigator.onLine) return
  if (syncing.value) return

  syncing.value = true
  try {
    const all = await idbGetAll()
    const pend = all.filter(x => x.status === 'pending' || x.status === 'error')

    for (const item of pend) {
      await uploadCase(item)
      await idbDelete(item.id)
    }

    window.dispatchEvent(new Event('cases:changed'))
  } catch (err) {
    console.error('Error sincronizando pendientes:', err)
  } finally {
    syncing.value = false
  }
}
</script>