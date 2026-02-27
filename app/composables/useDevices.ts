import { ref, type Ref } from 'vue'

export function useDevices() {
  const videoInputs = ref<MediaDeviceInfo[]>([])
  const selectedDeviceId = ref('')
  const permissionPrimed = ref(false)

  async function primePermissions() {
    if (permissionPrimed.value) return
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      tmp.getTracks().forEach((t) => t.stop())
      permissionPrimed.value = true
    } catch {}
  }

  async function loadVideoDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      videoInputs.value = []
      return
    }
    const all = await navigator.mediaDevices.enumerateDevices()
    videoInputs.value = all.filter((d) => d.kind === 'videoinput')
  }


  async function handleSelectedDeviceChange(args: {
    newId: string
    oldId: string
    cameraOn: Ref<boolean>
    recording: Ref<boolean>
    startCamera: () => Promise<void>
    setMsg: (t: string) => void
    revert: (v: string) => void
  }) {
    const { newId, oldId, cameraOn, recording, startCamera, setMsg, revert } = args
    if (newId === oldId) return
    if (!cameraOn.value) return

    if (recording.value) {
      setMsg('No puedes cambiar cámara mientras grabas.')
      revert(oldId || '')
      return
    }
    await startCamera()
  }

  return {
    videoInputs,
    selectedDeviceId,
    permissionPrimed,
    primePermissions,
    loadVideoDevices,
    handleSelectedDeviceChange
  }
}