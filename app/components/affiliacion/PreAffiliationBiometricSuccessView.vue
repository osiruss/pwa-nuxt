<script setup lang="ts">
const emit = defineEmits<{
  (e: 'continue'): void
}>()
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
      <span class="lh-step" />
    </div>

    <main class="lh-container">
      <section class="lh-card lh-card--form">
        <div class="lh-stack lh-stack--form">
          <div class="lh-resultBox lh-resultBox--success lh-resultBox--lg">
            <div class="lh-resultBox__icon">✓</div>

            <div class="lh-resultBox__content">
              <div class="lh-resultBox__title lh-resultBox__title--xl">
                Validación de identidad ingresada con éxito.
              </div>

              <div class="lh-resultBox__text lh-resultBox__text--lg">
                Ya puedes continuar con el proceso de Pre-afiliación.
              </div>
            </div>
          </div>

          <button class="lh-btnPrimary" type="button" @click="emit('continue')">
            Continuar
          </button>
        </div>
      </section>

      <!-- <div class="lh-bottomSpacer"></div> -->
    </main>
  </div>
</template>