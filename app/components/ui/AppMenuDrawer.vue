<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, navigateTo } from '#app'
import BaseDrawer from '~/components/ui/BaseDrawer.vue'

type IconName =
  | 'home'
  | 'user-plus-solid'
  | 'file-lines-solid'
  | 'logout-solid'
  | 'eye'
  | 'share'
  | 'menu'
  | 'arrow-right'

export type AppMenuItem = {
  key: string
  label: string
  icon?: IconName
  to?: string
}



const props = withDefaults(defineProps<{
  modelValue: boolean
  items: AppMenuItem[]
  activeKey?: string
  width?: number
  background?: string
}>(), {
  width: 375,
  background: '#F0F3F7'
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', key: string): void
  (e: 'logout'): void
}>()

const route = useRoute()

function close() {
  emit('update:modelValue', false)
}

function onSelect(key: string) {
  emit('select', key)
  close()
}

function onLogout() {
  emit('logout')
  close()
}

/** ✅ Auto-highlight si no viene activeKey */
const activeKeyAuto = computed(() => {
  if (props.activeKey) return props.activeKey
  const found = props.items.find(i => i.to && i.to === route.path)
  return found?.key
})

/** ✅ Cerrar al cambiar ruta */
watch(
  () => route.fullPath,
  () => {
    if (props.modelValue) close()
  }
)
</script>

<template>
  <BaseDrawer
  :model-value="modelValue"
  side="left"
  :width="width"
  :background="background"
  @update:modelValue="emit('update:modelValue', $event)"
>
  <div class="amd">
    <nav class="amd__list">
      <button
        v-for="it in items"
        :key="it.key"
        class="amd__item"
        :class="{ 'amd__item--active': it.key === activeKey }"
        type="button"
        @click="onSelect(it.key)"
      >
        <span class="amd__icon" :class="{ 'amd__icon--placeholder': !it.icon }">
          <UiIcon v-if="it.icon" :name="it.icon" :size="26" />
        </span>
        <span class="amd__text">{{ it.label }}</span>
      </button>
    </nav>

    <div class="amd__footer">
      <button class="amd__logout" type="button" @click="onLogout">
        <span class="amd__icon">
          <UiIcon name="logout-solid" :size="26" />
        </span>
        <span class="amd__text">Cerrar sesión</span>
      </button>
    </div>
  </div>
</BaseDrawer>
</template>

<style scoped>
.amd{
  height: 100svh;
  height: 100vh;
  position: relative;
  padding: clamp(72px, 12vh, 120px) 20px calc(92px + env(safe-area-inset-bottom));
  overflow: hidden;
  box-sizing: border-box;
  background: #F0F3F7;
}
.amd__list{
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.amd__list::-webkit-scrollbar{
  width: 0;
  height: 0;
}

.amd__item{
  width: 100%;
  display:flex;
  align-items:center;
  gap: 16px;
  padding: 10px 8px;
  border: 0;
  background: transparent;
  text-align: left;
  color: #00275E;
}

.amd__item--active{
  padding: 18px 16px;
  border-radius: 14px;
  background: rgba(227, 238, 252, 0.95);
}

.amd__logout{
  width: auto;
  display:flex;
  align-items:center;
  gap: 14px;
  padding: 12px 8px;
  border: 0;
  background: transparent;
  text-align: left;
  color: #00275E;
}

.amd__icon{
  width: 34px;
  height: 34px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#00275E;
}
.amd__icon--placeholder{
  width: 34px;
  height: 34px;
}

.amd__text{
  font-size: 20px;
  line-height: 24px;
  font-weight: 700;
}

/* ✅ Footer anclado abajo SIEMPRE */
.amd__footer{
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: calc(24px + env(safe-area-inset-bottom));
}

.amd__list,
.amd__footer{
  position: relative;
  z-index: 2;
}


</style>