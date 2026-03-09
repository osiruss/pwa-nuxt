<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  type?: 'text' | 'password'
  disabled?: boolean
}>(), { type: 'text', disabled: false })

const emit = defineEmits<{ (e:'update:modelValue', v:string): void }>()
</script>

<template>
  <label class="ui-field">
    <span v-if="label" class="ui-label">{{ label }}</span>

    <div class="ui-control">
      <input
        class="ui-input"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        autocomplete="off"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <slot name="right" />
    </div>
  </label>
</template>

<style scoped>
.ui-field{
  width:100%;
  display:grid;
  gap:6px;
}

.ui-label{
  font-weight:700;
  font-size:14px;
  line-height:20px;
  color: var(--text-title);
}

.ui-control{
  width:100%;
  height:56px;

  display:flex;
  align-items:center;
  gap:10px;

  padding:16px 14px;
  border:1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  box-sizing:border-box;
}

.ui-input{
  width:100%;
  border:0;
  outline:none;
  background:transparent;

  font-weight:400;
  font-size:16px;
  line-height:24px;
  color: var(--text-title);
}

.ui-input::placeholder{
  color: var(--text-muted);
}
</style>