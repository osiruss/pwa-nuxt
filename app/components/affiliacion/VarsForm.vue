<template>
  <div class="vars-panel">
    <label class="field">
      <span class="label">Nombre pensionado(a)</span>
      <input class="input" :value="vars.nombre" @input="emitVar('nombre', $event)" />
    </label>

    <label class="field">
      <span class="label">Rut Afiliado</span>
      <input class="input" :value="vars.rutAfiliado" @input="emitVar('rutAfiliado', $event)" />
    </label>

    <label class="field">
      <span class="label">Nombre Ejecutivo</span>
      <input class="input" :value="vars.nombreEjecutivo" @input="emitVar('nombreEjecutivo', $event)" />
    </label>

    <label class="field">
      <span class="label">Fecha</span>
      <input class="input" :value="vars.fecha" @input="emitVar('fecha', $event)" />
    </label>

    <label class="field">
      <span class="label">Hora</span>
      <input class="input" :value="vars.hora" @input="emitVar('hora', $event)" />
    </label>

    <div style="display:flex; gap:8px; margin-top:8px;">
      <button class="btn" type="button" @click="$emit('close')">
        Guardar
      </button>

      <button class="btn" type="button" @click="$emit('reset')">Limpiar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
type Vars = Record<string, any>

defineProps<{ vars: Vars }>()

const emit = defineEmits<{
  (e: 'setVar', k: string, v: string): void
  (e: 'close'): void
  (e: 'reset'): void
}>()

function emitVar(key: string, ev: Event) {
  emit('setVar', key, (ev.target as HTMLInputElement).value)
}
</script>