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
      <span class="lh-step lh-step--on" />
    </div>

    <main class="lh-container">
      <section class="lh-card lh-card--form">
        <slot />
      </section>

      <div class="lh-bottomSpacer"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
</script>