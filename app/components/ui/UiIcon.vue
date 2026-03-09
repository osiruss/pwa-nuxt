<script setup lang="ts">
type IconName =
  | 'eye'
  | 'share'
  | 'home'
  | 'menu'
  | 'arrow-right'
  | 'user-plus-solid'
  | 'file-lines-solid'
  | 'logout-solid'

const props = withDefaults(defineProps<{
  name: IconName
  size?: number
}>(), {
  size: 24
})
</script>

<template>

  <!-- EYE -->
  <svg v-if="name === 'eye'" :width="size" :height="size" viewBox="0 0 24 24" fill="none">
    <path d="M12 5C6 5 2 12 2 12C2 12 6 19 12 19C18 19 22 12 22 12C22 12 18 5 12 5Z" stroke="currentColor"
      stroke-width="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
  </svg>

  <!-- SHARE -->
  <svg v-else-if="name === 'share'" :width="size" :height="size" viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5" r="3" fill="currentColor" />
    <circle cx="6" cy="12" r="3" fill="currentColor" />
    <circle cx="18" cy="19" r="3" fill="currentColor" />

    <path d="M8.5 11L15.5 6" stroke="currentColor" stroke-width="2" />
    <path d="M8.5 13L15.5 18" stroke="currentColor" stroke-width="2" />
  </svg>

  <!-- HOME -->
  <svg v-else-if="name === 'home'" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12H5V20H10V14H14V20H19V12H22L12 3Z" />
  </svg>

  <!-- MENU -->
  <svg v-else-if="name === 'menu'" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="6" width="18" height="2" />
    <rect x="3" y="11" width="18" height="2" />
    <rect x="3" y="16" width="18" height="2" />
  </svg>

  <!-- ARROW RIGHT -->
  <svg v-else-if="name === 'arrow-right'" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 5L20 12L13 19V14H4V10H13V5Z" />
  </svg>

  <svg v-else-if="name === 'user-plus-solid'" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <!-- usuario -->
    <path d="M12 12c2.76 0 5-2.46 5-5.5S14.76 1 12 1 7 3.46 7 6.5 9.24 12 12 12z" />

    <!-- cuerpo -->
    <path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6v1H4v-1z" />

    <!-- plus -->
    <path d="M20 8h-2V6h-2v2h-2v2h2v2h2v-2h2z" />
  </svg>

  <svg v-else-if="name === 'logout-solid'" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h10v4h-2V5H5v14h6v-2h2v4H3z" />

    <path d="M14 12l-3-3v2H7v2h4v2z" />
  </svg>


  <svg v-else-if="name === 'file-lines-solid'" :width="size" :height="size" viewBox="0 0 24 24" fill="currentColor">
    <!-- documento -->
    <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />

    <!-- líneas -->
    <rect x="8" y="11" width="8" height="2" fill="#fff" />
    <rect x="8" y="15" width="8" height="2" fill="#fff" />
  </svg>

</template>

<style scoped>
svg {
  display: block;
}
</style>