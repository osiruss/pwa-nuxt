<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { type: 'button', disabled: false })
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" class="ui-btn">
    <slot />
  </button>
</template>

<style scoped>
.ui-btn{
  width:100%;
  height:48px;

  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;

  padding:16px 24px;
  border-radius: var(--radius-pill);

  background: var(--bg-fill-primary);
  color:#FCFBFA;

  font-family: var(--font-sora);
  font-weight:600;
  font-size:16px;
  line-height:24px;

  cursor:pointer;
}

.ui-btn:disabled{
  opacity:.6;
  cursor:not-allowed;
}
</style>