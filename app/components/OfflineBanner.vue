<template>
  <Transition name="slide">
    <div v-if="!isOnline"
         class="offline-banner">
      📡 Sin conexión a Internet.
      Los datos se guardarán localmente.
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isOnline } = useNetwork()
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: #dc2626;
  color: white;
  text-align: center;
  padding: 10px;
  font-weight: 600;
  z-index: 9999;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from {
  transform: translateY(-100%);
}
.slide-leave-to {
  transform: translateY(-100%);
}
</style>
