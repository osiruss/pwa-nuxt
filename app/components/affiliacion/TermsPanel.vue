<template>
  <div class="stack">
    <label class="field">
      <span class="label">RUT pensionado</span>
      <input :value="rut" @input="onRutInput" placeholder="12.345.678-9" class="input" />
    </label>

    <div class="terms">
      <h2 class="terms__title">{{ renderedTitle || (pendingx ? 'Cargando…' : 'Sin titulo') }}</h2>

      <p v-for="(p, i) in paragraphs" :key="i" class="terms__p">
        {{ p }}
      </p>

      <p v-if="source === 'cache'" style="opacity:.7">
        Estás viendo una copia offline guardada.
      </p>
      <p v-else-if="error && !paragraphs" style="opacity:.7">
        No se pudo cargar el contenido.
      </p>

      <label class="checkbox">
        <input type="checkbox" :checked="accepted" @change="onAcceptedChange" />
        <span>He leído las condiciones.</span>
      </label>

      <button class="btn btn-ghost2" @click="$emit('back')" :disabled="syncing || !online">
        ← Volver
      </button>

      <button class="btn" type="button" @click="$emit('toggleVarsForm')">📝 Ingresar datos</button>

      <VarsForm
        v-if="showVarsForm"
        :vars="vars"
        @setVar="onSetVar"
        @close="$emit('closeVarsForm')"
        @reset="$emit('resetVars')"
      />

      <p v-if="error" class="terms__p" style="opacity:.7">
        contenido cargado modo offline.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import VarsForm from '~/components/affiliacion/VarsForm.vue'

type Vars = Record<string, any>

defineProps<{
  rut: string
  accepted: boolean
  renderedTitle: string | null | undefined
  pendingx: any
  paragraphs: any
  error: any
  source: any
  online: boolean
  syncing: boolean
  showVarsForm: boolean
  vars: Vars
}>()

const emit = defineEmits<{
  (e: 'update:rut', v: string): void
  (e: 'update:accepted', v: boolean): void
  (e: 'back'): void
  (e: 'toggleVarsForm'): void
  (e: 'closeVarsForm'): void
  (e: 'resetVars'): void
  (e: 'setVar', k: string, v: string): void
}>()

function onRutInput(e: Event) {
  emit('update:rut', (e.target as HTMLInputElement).value)
}

function onAcceptedChange(e: Event) {
  emit('update:accepted', (e.target as HTMLInputElement).checked)
}

function onSetVar(k: string, v: string) {
  emit('setVar', k, v)
}
</script>