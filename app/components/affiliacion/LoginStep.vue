<script setup lang="ts">
const props = defineProps<{
  rut: string
  pass: string
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e:'update:rut', v:string): void
  (e:'update:pass', v:string): void
  (e:'submit'): void
  (e:'forgot'): void
}>()

function onSubmit(){
  if (props.loading) return
  emit('submit')
}
</script>

<template>
  <div class="login-page">

    <!-- TOP URL BAR (Figma) -->
    <!-- <div class="login-topbar">
      <div class="login-url">autoatención.losheroes.cl</div>

      <button type="button" class="login-share" aria-label="Compartir">
        <UiIcon name="share" :size="14" />
      </button>
    </div> -->

    <div class="login-box">
      <!-- Logo -->
      <!-- <UiLogoLosHeroes class="login-logo" /> -->

      <div class="login-header">

            <UiLogoLosHeroes class="login-logo" />

            <div class="login-title">
              Portal de Preafiliación
            </div>

          </div>

      <div class="login-form">
        <UiInput
          label="RUT"
          :modelValue="rut"
          placeholder="Ej: 112346546 (RUT personal)"
          @update:modelValue="emit('update:rut', $event)"
        />

        <UiInput
          label="Contraseña"
          type="password"
          :modelValue="pass"
          placeholder="Escribe aquí tu contraseña..."
          @update:modelValue="emit('update:pass', $event)"
        >

          <template #right>
            <UiIcon name="eye" :size="20" />
          </template>

        </UiInput>

        <!-- LINK (sin borde, sin fondo) -->
        <button type="button" class="login-forgot" @click="emit('forgot')">
          ¿Olvidaste tu contraseña?
        </button>

        <UiButton :disabled="loading" @click="onSubmit" class="login-submit">
          Ingresar
        </UiButton>

        <p v-if="error" class="login-error">{{ error }}</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.login-page{
  min-height:100dvh;
  background:#fff;
}

/* Topbar estilo "Safari" del mock */
.login-topbar{
  height:88px;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  padding: 0 16px 14px;
  box-sizing:border-box;
  background:#fff;
}

.login-url{
  height:40px;
  width:min(343px, 100%);
  border-radius: 999px;
  background:#E8E9ED;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  font-size:16px;
  color:#000;
  position:relative;
}

/* botón share a la derecha encima del pill */
.login-share{
  position:absolute;
  right: 26px;
  transform: translateY(-2px);
  width:40px;
  height:40px;
  border-radius:10px;
  display:grid;
  place-items:center;
  background:transparent;
  cursor:pointer;
  color:#6b6b6b;
}

/* body */
.login-box{
  width:100%;
  max-width:343px;
  margin: 24px auto 0;
  padding: 0 16px;
  box-sizing:border-box;

  display:flex;
  flex-direction:column;
  align-items:center;
  gap:28px;
}

.login-logo{
  width:165px;
  height:auto;
  display:block;
}

.login-title{
  font-family: var(--font-figtree);
  font-weight:600;
  font-size:18px;
  line-height:28px;
  text-align:center;
  color: var(--text-title);
}

.login-form{
  width:100%;
  display:grid;
  gap:16px;
}

/* ojo dentro del input (solo decorativo por ahora) */
.login-eye{
  display:flex;
  align-items:center;
  justify-content:center;
  width:24px;
  height:24px;
  color: var(--text-muted);
}

/* link forgot (Figma: naranja, alineado derecha, sin caja) */
.login-forgot{
  padding:0;
  margin:0;
  background:transparent;
  border:0;
  text-align:right;
  cursor:pointer;

  font-family: var(--font-sora);
  font-weight:600;
  font-size:13px;
  line-height:24px;
  color: var(--bg-fill-primary);
}

.login-error{
  margin:0;
  font-size:13px;
  color:#b00020;
}

.login-header{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:14px;
  margin-top:20px;
}

.login-logo{
  width:140px;
  height:auto;
}

.login-title{
  font-family: var(--font-figtree);
  font-weight:600;
  font-size:20px;
  text-align:center;
}

.login-topbar{
  display:flex;
  justify-content:center;
  padding:20px 16px;
}

.login-url{
  width:100%;
  max-width:340px;
  height:44px;

  background:#E8E9ED;
  border-radius:999px;

  display:flex;
  align-items:center;
  justify-content:center;

  position:relative;

  padding-right:44px; /* espacio para el icono */
}

.login-share{
  position:absolute;
  right:50px;
  transform:translateY(-5%);
  width:40px;
  height:40px;

  border-radius:10px;
  border:1px solid transparent;

  background-color: transparent;

  display:flex;
  align-items:center;
  justify-content:center;

  cursor:pointer;
}
</style>