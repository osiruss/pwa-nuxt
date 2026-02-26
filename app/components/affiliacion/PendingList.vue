<template>
  <div v-if="items.length" class="pending">
    <div class="pending__head">
      <h3 class="subtitle">📋 Pendientes ({{ items.length }})</h3>
      <button class="btn" @click="$emit('refresh')" :disabled="syncing">🔁 Actualizar</button>
    </div>

    <div class="pending__list">
      <div v-for="item in items" :key="item.id" class="pending__item">
        <div class="pending__info">
          <div class="pending__rut">RUT: {{ item.rut }}</div>
          <div class="pending__sub">{{ formatDate(item.createdAt) }} · ID: {{ item.id }}</div>

          <div class="pending__sub">
            ⏱ {{ formatDuration(mediaMeta[item.id]?.durationSec ?? null) }}
            · 💾 {{ formatBytes(mediaMeta[item.id]?.sizeBytes ?? 0) }}
          </div>

          <div v-if="item.status === 'ready' && item.confirmedAt" class="pending__sub">
            Confirmado: {{ formatDate(item.confirmedAt) }} · Auto-envío en: {{ remainingText(item) }}
          </div>
        </div>

        <div class="pending__actions">
          <span :style="badgeStyle(item.status)">{{ item.status }}</span>

          <button class="btn" @click="$emit('edit', item)" :disabled="syncing">
            ✏️ Editar video
          </button>

          <button class="btn" @click="$emit('preview', item)">▶️ Ver</button>
          <button @click="$emit('download', item)">⬇️ Descargar</button>

          <button v-if="item.status === 'review'" class="btn" @click="$emit('confirm', item)" :disabled="syncing">
            ✅ Confirmar
          </button>

          <button class="btn" @click="$emit('syncOne', item)" :disabled="syncing || !online || item.status !== 'ready'">
            ⬆️ Subir
          </button>

          <button class="btn" @click="$emit('remove', item.id)" :disabled="syncing">🗑️</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty">No hay pendientes.</div>
</template>

<script setup lang="ts">
defineProps<{
  items: any[]
  mediaMeta: Record<string, any>
  syncing: boolean
  online: boolean
  formatBytes: (n: number) => string
  formatDuration: (n: number | null) => string
  formatDate: (n: number) => string
  badgeStyle: (s: any) => string
  remainingText: (item: any) => string
}>()

defineEmits<{
  (e: 'refresh'): void
  (e: 'edit', item: any): void
  (e: 'preview', item: any): void
  (e: 'download', item: any): void
  (e: 'confirm', item: any): void
  (e: 'syncOne', item: any): void
  (e: 'remove', id: string): void
}>()
</script>