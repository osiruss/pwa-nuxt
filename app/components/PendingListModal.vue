<template>
  <!-- <UModal
  v-model="open"
  :ui="{
    overlay: 'bg-black/60 backdrop-blur-sm',
    container: 'flex items-center justify-center',
    width: 'sm:max-w-2xl'
  }"
>
    <UCard class="w-full bg-neutral-900 border border-neutral-800 shadow-2xl">

      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-inbox" class="w-5 h-5" />
            <span class="font-semibold truncate">Pendientes de envío</span>
            <UBadge v-if="items.length" color="amber" variant="soft">
              {{ items.length }}
            </UBadge>
          </div>

          <div class="flex items-center gap-2">
            <UBadge :color="isOnline ? 'green' : 'red'" variant="soft" icon="i-lucide-wifi">
              {{ isOnline ? 'Conectado' : 'Sin conexión' }}
            </UBadge>

            <UButton color="gray" variant="ghost" icon="i-lucide-x" @click="open = false" aria-label="Cerrar" />
          </div>
        </div>
      </template>

      <div class="space-y-3">
        <UAlert v-if="!items.length" color="gray" variant="soft" icon="i-lucide-info">
          No hay pendientes.
        </UAlert>

        <div v-else class="max-h-[360px] overflow-auto pr-1 space-y-2">
          <div v-for="it in items" :key="it.id"
            class="flex items-start justify-between gap-3 p-3 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold truncate">RUT: {{ it.rut }}</span>
                <UBadge :color="badgeColor(it.status)" variant="soft">
                  {{ statusLabel(it.status) }}
                </UBadge>
              </div>

              <div class="text-xs text-gray-500 mt-1">
                {{ formatDate(it.createdAt) }} · {{ approxSize(it.chunks) }} · {{ it.mimeType }}
              </div>

              <div v-if="it.lastError" class="text-xs text-red-400 mt-1 truncate">
                {{ it.lastError }}
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap justify-end">
              <UButton size="xs" color="gray" variant="soft" icon="i-lucide-play" @click="preview(it)">
                Preview
              </UButton>

              <UButton size="xs" color="primary" variant="outline" icon="i-lucide-arrow-up"
                :disabled="!isOnline || syncing" @click="syncOne(it)">
                Enviar
              </UButton>

              <UButton size="xs" color="red" variant="soft" icon="i-lucide-trash" @click="remove(it.id)">
                Eliminar
              </UButton>
            </div>
          </div>
        </div>


        <div v-if="previewUrl" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold">Preview local</div>
            <UButton size="xs" color="gray" variant="ghost" icon="i-lucide-x" @click="closePreview" />
          </div>

          <div class="rounded-xl overflow-hidden bg-black ring-1 ring-gray-200 dark:ring-gray-800">
            <video :src="previewUrl" controls class="w-full h-[280px] object-cover" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between gap-3">
          <div class="text-xs text-gray-500">
            {{ items.length ? `Se enviarán ${items.length} caso(s)` : '—' }}
          </div>

          <div class="flex items-center gap-2">
            <UButton color="gray" variant="soft" icon="i-lucide-refresh-cw" :disabled="syncing" @click="refresh">
              Actualizar
            </UButton>

            <UButton color="primary" icon="i-lucide-arrow-up" :disabled="!isOnline || !items.length || syncing"
              @click="syncAll">
              {{ syncing ? 'Enviando…' : 'Enviar todos' }}
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal> -->
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { idbGetAll, idbDelete, type StoredCase } from '~/utils/idb'

const props = withDefaults(defineProps<{
  modelValue: boolean
  onUpload: (item: StoredCase) => Promise<void>
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'changed'): void
}>()

const open = ref<boolean>(props.modelValue)
const items = ref<StoredCase[]>([])
const syncing = ref(false)

const isOnline = ref(true)
const previewUrl = ref<string>('')

watch(() => props.modelValue, (v) => { open.value = v })
watch(open, async (v) => {
  emit('update:modelValue', v)
  if (v) await refresh()
  if (!v) closePreview()
})

function updateNetwork() {
  isOnline.value = navigator.onLine
}

function formatDate(ts: number) {
  try { return new Date(ts).toLocaleString('es-CL') } catch { return String(ts) }
}

function approxSize(chunks: Blob[]) {
  const bytes = chunks.reduce((a, b) => a + (b?.size || 0), 0)
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function badgeColor(status: StoredCase['status']) {
  if (status === 'pending') return 'amber'
  if (status === 'error') return 'red'
  if (status === 'uploading') return 'blue'
  return 'green'
}

function statusLabel(status: StoredCase['status']) {
  if (status === 'pending') return 'pendiente'
  if (status === 'error') return 'error'
  if (status === 'uploading') return 'subiendo'
  return 'enviado'
}

async function refresh() {
  const all = await idbGetAll()
  items.value = all.filter(x => x.status === 'pending' || x.status === 'error')
}

function closePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function preview(it: StoredCase) {
  closePreview()
  const blob = new Blob(it.chunks, { type: it.mimeType })
  previewUrl.value = URL.createObjectURL(blob)
}

async function remove(id: string) {
  closePreview()
  await idbDelete(id)
  await refresh()
  emit('changed')
}

async function syncOne(it: StoredCase) {
  if (!isOnline.value) return
  syncing.value = true
  try {
    await props.onUpload(it)
    await idbDelete(it.id)
    await refresh()
    emit('changed')
  } finally {
    syncing.value = false
  }
}

async function syncAll() {
  if (!isOnline.value) return
  syncing.value = true
  try {
    for (const it of [...items.value]) {
      await props.onUpload(it)
      await idbDelete(it.id)
    }
    await refresh()
    emit('changed')
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  updateNetwork()
  window.addEventListener('online', updateNetwork)
  window.addEventListener('offline', updateNetwork)
  window.addEventListener('cases:changed', refresh)
  await refresh()
})

onBeforeUnmount(() => {
  window.removeEventListener('online', updateNetwork)
  window.removeEventListener('offline', updateNetwork)
  window.removeEventListener('cases:changed', refresh)
  closePreview()
})
</script>
