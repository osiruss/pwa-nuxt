<template>
  <Transition name="fade-slide">
    <div v-if="visible" class="ops-wrapper">
      <div
        class="ops-bar"
        :class="netState === 'offline'
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-primary-500/10 border-primary-500/30'"
      >
        <!-- LADO IZQUIERDO -->
        <div class="flex items-center gap-3 min-w-0">
          <UIcon
            :name="netState === 'offline' ? 'i-lucide-wifi-off' : 'i-lucide-wifi'"
            class="w-4 h-4 shrink-0"
          />

          <span class="text-sm font-semibold truncate">
            <template v-if="netState === 'offline'">
              Sin conexión — guardando localmente
            </template>
            <template v-else>
              Conectado
            </template>
          </span>

          <UBadge
            v-if="pendingCount > 0"
            color="amber"
            variant="soft"
            size="sm"
          >
            {{ pendingCount }} pendiente{{ pendingCount > 1 ? 's' : '' }}
          </UBadge>
        </div>

        <!-- LADO DERECHO -->
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            v-if="pendingCount > 0"
            size="xs"
            color="primary"
            variant="ghost"
            icon="i-lucide-inbox"
            @click="$emit('openPending')"
          >
            Ver
          </UButton>

          <UButton
            v-if="pendingCount > 0"
            size="xs"
            color="primary"
            variant="solid"
            icon="i-lucide-refresh-cw"
            :loading="syncing"
            :disabled="netState !== 'online'"
            @click="handleSync"
          >
            Sincronizar
          </UButton>

          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            icon="i-lucide-x"
            @click="visible = false"
            aria-label="Cerrar"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

defineEmits<{ (e: 'openPending'): void }>()

const props = defineProps<{
  onSync?: () => Promise<void> | void
}>()

const { netState, pendingCount } = useOpsBar()

const visible = ref(true)
const syncing = ref(false)

// Auto mostrar si hay problema o pendientes
watch([netState, pendingCount], ([ns, pc]) => {
  if (ns === 'offline') visible.value = true
  if (pc > 0) visible.value = true
})

async function handleSync() {
  if (!props.onSync || netState.value !== 'online') return
  syncing.value = true
  try {
    await props.onSync()
  } finally {
    syncing.value = false
  }
}
</script>

<style scoped>
.ops-wrapper {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: min(960px, calc(100% - 32px));
  z-index: 9999;
}

.ops-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid;

  backdrop-filter: blur(6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all .25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}
</style>
