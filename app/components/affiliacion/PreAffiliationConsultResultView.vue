<script setup lang="ts">
import { computed } from 'vue'

type AffiliationStatus = 'not-affiliated' | 'affiliated'

const props = withDefaults(defineProps<{
  rut: string
  prospectName?: string
  benefitStartDate?: string
  compensationBox?: string
  status?: AffiliationStatus
}>(), {
  prospectName: '',
  benefitStartDate: '',
  compensationBox: '',
  status: 'not-affiliated'
})

const emit = defineEmits<{
  (e: 'continue'): void
  (e: 'back'): void
  (e: 'cancel'): void
}>()

const isNotAffiliated = computed(() => props.status === 'not-affiliated')

const resultTitle = computed(() =>
  isNotAffiliated.value ? 'No afiliado/a' : 'Afiliado/a'
)

const resultMessage = computed(() =>
  isNotAffiliated.value
    ? `El cliente con RUT ${props.rut} no se encuentra afiliado a ninguna caja de compensación.`
    : `El cliente con RUT ${props.rut} se encuentra afiliado a otra caja de compensación.`
)

const benefitDateText = computed(() =>
  props.benefitStartDate || (isNotAffiliated.value ? 'Sin afiliación' : '-')
)

const compensationBoxText = computed(() =>
  props.compensationBox || (isNotAffiliated.value ? 'Sin afiliación' : '-')
)
</script>

<template>
  <div class="lh lh-view">
    <header class="lh-heroHead">
      <h1 class="lh-heroHead__title">
        Completa los siguientes pasos para ingresar la preafiliaciónaaaaaa
      </h1>
    </header>

    <div class="lh-stepbar">
      <span class="lh-step lh-step--done" />
      <span class="lh-step lh-step--on" />
      <span class="lh-step" />
      <span class="lh-step" />
    </div>

    <main class="lh-container">
      <section class="lh-card">
        <div class="lh-stack">
          <div>
            <div class="lh-title">Consulta de afiliación.</div>
            <div class="lh-caption">
              Verifica si el cliente está afiliado en otra caja.
            </div>
          </div>

          <div class="lh-fieldBlock">
            <label class="lh-label">Rut del cliente</label>
            <div class="lh-inputLike">
              {{ rut }}
            </div>
          </div>

          <div class="lh-resultSection">
            <div class="lh-subtitleStrong">Resultado consulta afiliación</div>

            <div
              class="lh-resultBox"
              :class="isNotAffiliated ? 'lh-resultBox--success' : 'lh-resultBox--warning'"
            >
              <div class="lh-resultBox__icon">✓</div>

              <div class="lh-resultBox__content">
                <div class="lh-resultBox__title">
                  {{ resultTitle }}
                </div>
                <div class="lh-resultBox__text">
                  {{ resultMessage }}
                </div>
              </div>
            </div>
          </div>

          <div class="lh-infoCard">
            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Nombre prospecto</div>
              <div class="lh-infoItem__value">{{ prospectName || '-' }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Fecha inicio beneficio</div>
              <div class="lh-infoItem__value">{{ benefitDateText }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Caja de Compensación</div>
              <div class="lh-infoItem__value">{{ compensationBoxText }}</div>
            </div>
          </div>

          <button class="lh-btnPrimary" type="button" @click="emit('continue')">
            Continuar
          </button>

          <button class="lh-btnOutline" type="button" @click="emit('back')">
            Volver atrás
          </button>
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
.preaff-view {
  height: 100vh;
  overflow-y: auto;
  background: #f3f5f7;
  padding-bottom: 90px;
}</style>