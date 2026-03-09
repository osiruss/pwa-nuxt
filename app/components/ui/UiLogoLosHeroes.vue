<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'full' | 'isotipo'
}>(), {
  variant: 'full'
})
</script>

<template>


  <img
    v-if="variant === 'full'"
    src="/los-heroes-logo.png"
    alt="Los Héroes"
    class="logo-full"
  />

  <img
    v-else
    src="/los-heroes-isotipo.png"
    alt="Los Héroes"
    class="logo-isotipo"
  />

</template>

<style scoped>

.logo-full{
  display:block;
  width:160px;
  height:auto;
}

.logo-isotipo{
  display:block;
  width:44px;
  height:auto;
}

</style>