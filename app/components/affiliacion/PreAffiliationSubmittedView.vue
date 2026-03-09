<script setup lang="ts">
defineProps<{
  eventId: string
  statusText: string
  submittedAt: string
  clientRut: string
  clientName: string
  compensationBox: string
  executiveName: string
  executiveRut: string
  executiveEmail: string
  branchCode: string
}>()

const emit = defineEmits<{ (e: 'goHome'): void }>()
</script>

<template>
  <div class="lh lh-view">
    <header class="lh-heroHead">
      <h1 class="lh-heroHead__title">
        Completa los siguientes pasos para ingresar la preafiliación
      </h1>
    </header>

    <div class="lh-stepbar">
      <span class="lh-step lh-step--done" />
      <span class="lh-step lh-step--done" />
      <span class="lh-step lh-step--done" />
      <span class="lh-step lh-step--done" />
    </div>

    <main class="lh-container">
      <section class="lh-card lh-card--form">
        <div class="lh-stack lh-stack--form">
          <div class="lh-resultBox lh-resultBox--success">
            <div class="lh-resultBox__icon">✓</div>
            <div class="lh-resultBox__content">
              <div class="lh-resultBox__title">
                Preafiliación ingresada exitosamente.
              </div>
            </div>
          </div>

          <div class="lh-subtitleStrong">Detalle Preafiliación</div>

          <div class="lh-infoCard">
            <div class="lh-sectionTitle">Datos del cliente</div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">ID del evento</div>
              <div class="lh-infoItem__value">{{ eventId }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Estado Preafiliación</div>
              <div class="lh-infoItem__value">{{ statusText }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Fecha ingreso Preafiliación</div>
              <div class="lh-infoItem__value">{{ submittedAt }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">RUT del cliente</div>
              <div class="lh-infoItem__value">{{ clientRut }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Nombre del cliente</div>
              <div class="lh-infoItem__value">{{ clientName }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Caja de compensación</div>
              <div class="lh-infoItem__value">{{ compensationBox }}</div>
            </div>

            <div class="lh-sectionTitle lh-sectionTitle--spaced">Datos del ejecutivo</div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Nombre del ejecutivo</div>
              <div class="lh-infoItem__value">{{ executiveName }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">RUT del ejecutivo</div>
              <div class="lh-infoItem__value">{{ executiveRut }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Correo electrónico</div>
              <div class="lh-infoItem__value">{{ executiveEmail }}</div>
            </div>

            <div class="lh-infoItem">
              <div class="lh-infoItem__label">Código de la sucursal</div>
              <div class="lh-infoItem__value">{{ branchCode }}</div>
            </div>
          </div>

          <button class="lh-btnPrimary" type="button" @click="emit('goHome')">
            Volver al inicio
          </button>
        </div>
      </section>

      <!-- <div class="lh-bottomSpacer"></div> -->
    </main>
  </div>
</template>