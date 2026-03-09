<script setup lang="ts">
const menuOpen = ref(false)
const emit = defineEmits<{
  (e: 'enter'): void
  (e: 'openPortal'): void
}>()

const executiveName = 'Constanza Vera Veas'
const executiveRut = '11.654.768-9'
const executiveEmail = 'c.vera@losheroes.cl'
</script>

<template>
  <div class="lh lh-view">
    <header class="lh-topbar">
      <div class="lh-topbar__inner">
        <UiLogoLosHeroes variant="isotipo" style="width:44px;height:44px;" />
        <h1 class="lh-topbar__title">Portal de PreAfiliación</h1>
      </div>
    </header>

    <section class="lh-card lh-stack">
      <h2 class="lh-h2">Bienvenido a tu Portal de Preafiliación</h2>

      <div class="lh-infoBox">
        <div>
          <div class="lh-label">Nombre ejecutivo</div>
          <div class="lh-value">{{ executiveName }}</div>
        </div>

        <div>
          <div class="lh-label">Rut</div>
          <div class="lh-value">{{ executiveRut }}</div>
        </div>

        <div>
          <div class="lh-label">Correo electrónico</div>
          <div class="lh-value">{{ executiveEmail }}</div>
        </div>
      </div>

      <UiButton class="lh-btnPrimary" @click="emit('enter')">
        Ingresar Pre-afiliación
        <UiIcon name="arrow-right" :size="18" />
      </UiButton>
    </section>

    <!-- si mantienes el bottom nav global en app.vue, puedes quitar esto -->
    <!-- <nav class="lh-bottomBar">
      <div class="lh-bottomBar__inner">
        <button class="lh-tab lh-tab--active" type="button">
          <span class="lh-tab__pill">
            <UiIcon name="home" :size="22" />
          </span>
          <span class="lh-tab__text">Inicio</span>
        </button>

        <button class="lh-tab" type="button" @click="menuOpen = true">
          <span class="lh-tab__pill lh-tab__pill--plain">
            <UiIcon name="menu" :size="22" />
          </span>
          <span class="lh-tab__text">Menú</span>
        </button>
      </div>
    </nav> -->
  </div>
</template>

<style scoped>
/* welcome ya no necesita CSS (solo deja aquí excepciones puntuales si aparecen) */
</style>