<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
    (e: 'consult', payload: { rut: string }): void
    (e: 'back'): void
    (e: 'cancel'): void
}>()

const rut = ref('')

const canConsult = computed(() => rut.value.trim().length > 7)

function onConsult() {
    if (!canConsult.value) return
    emit('consult', { rut: rut.value.trim() })
}
</script>

<template>
    <div class="lh lh-view">

        <!-- HEADER -->
        <header class="lh-heroHead">
            <h1 class="lh-heroHead__title">
                Completa los siguientes pasos para ingresar la preafiliación
            </h1>
        </header>

        <!-- STEP BAR -->
        <div class="lh-stepbar">
            <span class="lh-step lh-step--done" />
            <span class="lh-step lh-step--on" />
            <span class="lh-step" />
            <span class="lh-step" />
        </div>

        <main class="lh-container">

            <!-- CARD -->
            <section class="lh-card">

                <div class="lh-stack">

                    <div>
                        <div class="lh-title">Consulta de afiliación.</div>
                        <div class="lh-caption">Verifica si el cliente está afiliado en otra caja.</div>
                    </div>

                    <!-- INPUT RUT -->
                    <div class="lh-fieldGroup">
                        <div class="lh-fieldLabel">Rut del cliente</div>

                        <div class="lh-field">
                            <input v-model.trim="rut" class="lh-input" placeholder="Ej: 12.334.455-5"
                                inputmode="text" />
                        </div>
                    </div>

                    <!-- BOTÓN NARANJO -->
                    <button class="lh-btnPrimary" type="button" :disabled="!canConsult" @click="onConsult">
                        Consultar afiliación
                    </button>

                    <!-- BOTÓN BORDE AZUL -->
                    <button class="lh-btnOutline" type="button" @click="emit('back')">
                        Volver atrás
                    </button>

                </div>

            </section>

            <!-- CANCELAR -->
            <!-- <button
        class="lh-btnLink"
        type="button"
        @click="emit('cancel')"
      >
        Cancelar pre-afiliación
      </button> -->
            <button class="lh-btnSecondary" type="button" @click="emit('cancel')">
                Cancelar pre-afiliación
            </button>

            <!-- <div class="lh-bottomSpacer"></div> -->

        </main>

    </div>
</template>

<style scoped></style>