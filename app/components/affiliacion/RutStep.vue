<template>
  <div class="stack">
    <label class="field">
      <span class="label">RUT pensionado</span>
      <input :value="rut" @input="onInput" placeholder="12.345.678-9" class="input" />
    </label>

    <button class="btn" @click="$emit('continue')" :disabled="disabled">Continuar</button>

    <small class="hint">Ingresa el RUT para continuar.</small>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  rut: string
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rut', v: string): void
  (e: 'continue'): void
}>()

function onInput(e: Event) {
  emit('update:rut', ((e.target as HTMLInputElement).value || '').trim())
}
</script>