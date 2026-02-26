import { ref, type Ref } from 'vue'

export function useAnchorsPreview(args: {
  lastPreviewUrl: Ref<string>
}) {
  const topAnchorEl = ref<HTMLElement | null>(null)
  const previewAnchorEl = ref<HTMLElement | null>(null)

  function scrollToTopAnchor() {
    requestAnimationFrame(() => topAnchorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function scrollToPreview() {
    requestAnimationFrame(() => previewAnchorEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function cleanupPreview() {
    try {
      if (args.lastPreviewUrl.value) URL.revokeObjectURL(args.lastPreviewUrl.value)
    } catch {}
    args.lastPreviewUrl.value = ''
  }

  return {
    topAnchorEl,
    previewAnchorEl,
    scrollToTopAnchor,
    scrollToPreview,
    cleanupPreview
  }
}