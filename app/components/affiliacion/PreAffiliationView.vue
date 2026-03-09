<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'continue', payload: { eventId: string; branchCode: string }): void
  (e: 'cancel'): void
}>()

const eventId = ref('')
const branchCode = ref('')

const canContinue = computed(() =>
  eventId.value.trim().length > 0 && branchCode.value.trim().length > 0
)

function onContinue() {
  if (!canContinue.value) return
  emit('continue', { eventId: eventId.value.trim(), branchCode: branchCode.value.trim() })
  
}
</script>

<template>
  <div class="lh lh-view">
    <header class="lh-heroHead">
      <h1 class="lh-heroHead__title">
        Completa los siguientes pasos para ingresar la preafiliación
      </h1>
    </header>

    <div class="lh-stepbar">
      <span class="lh-step lh-step--on" />
      <span class="lh-step" />
      <span class="lh-step" />
      <span class="lh-step" />
    </div>

    <main class="lh-container">
      <section class="lh-card" style="padding:20px 16px 18px;">
        <div class="lh-stack" style="gap:18px;">
          <p class="lh-lead">Ingrese el ID del evento para gestionar la afiliación.</p>

          <div class="lh-fieldGroup">
            <div class="lh-fieldLabel">ID Evento</div>
            <div class="lh-field">
              <input v-model.trim="eventId" class="lh-input" placeholder="Ej: 12345" />
            </div>
            <div class="lh-caption">Ingrese el número identificador del evento a gestionar</div>
          </div>

          <div class="lh-fieldGroup">
            <div class="lh-fieldLabel">Código de la sucursal</div>
            <div class="lh-field">
              <input v-model.trim="branchCode" class="lh-input" placeholder="Ej: 12345" inputmode="numeric" />
            </div>
          </div>

         <button class="lh-btnPrimary" type="button" :disabled="!canContinue" @click="onContinue">Continuar</button>
        </div>
      </section>

      <button class="lh-btnSecondary" type="button" @click="emit('cancel')">
        Cancelar pre-afiliación
      </button>
      <!-- <div class="lh-bottomSpacer"></div> -->
    </main>
  </div>
</template>
<style scoped>
</style>