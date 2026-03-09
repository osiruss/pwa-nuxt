<script setup lang="ts">
const emit = defineEmits<{
  (e: 'startBiometric'): void
  (e: 'back'): void
  (e: 'cancel'): void
}>()

function onStart() {
  emit('startBiometric')
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
      <span class="lh-step lh-step--done" />
      <span class="lh-step lh-step--done" />
      <span class="lh-step lh-step--on" />
      <span class="lh-step" />
    </div>

    <main class="lh-container">
      <section class="lh-card lh-card--form">
        <div class="lh-stack lh-stack--form">
          <div>
            <div class="lh-title">Validación biométrica.</div>
            <div class="lh-caption">
              Confirma la identidad del cliente utilizando su cédula de identidad y reconocimiento facial.
            </div>
          </div>

          <div class="lh-illus" aria-hidden="true">
            <svg class="lh-illus__svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path
                d="M28 42V34C28 30.686 30.686 28 34 28H42"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
              />
              <path
                d="M78 28H86C89.314 28 92 30.686 92 34V42"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
              />
              <path
                d="M92 78V86C92 89.314 89.314 92 86 92H78"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
              />
              <path
                d="M42 92H34C30.686 92 28 89.314 28 86V78"
                stroke="currentColor"
                stroke-width="8"
                stroke-linecap="round"
              />

              <circle cx="60" cy="56" r="14" fill="currentColor" opacity="0.25" />
              <path d="M38 92c3-14 15-22 22-22s19 8 22 22" fill="currentColor" opacity="0.25" />
            </svg>
          </div>

          <button class="lh-btnPrimary" type="button" @click="onStart">
            Iniciar validación biométrica
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