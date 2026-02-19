export const useCamera = () => {
  const devices = ref<MediaDeviceInfo[]>([])
  const selectedDeviceId = ref<string | null>(null)
  const stream = ref<MediaStream | null>(null)

  const loadDevices = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    devices.value = allDevices.filter(d => d.kind === 'videoinput')
  }

  const startCamera = async () => {
    if (!selectedDeviceId.value) return

    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: selectedDeviceId.value }
      },
      audio: false
    })

    return stream.value
  }

  const stopCamera = () => {
    stream.value?.getTracks().forEach(track => track.stop())
  }

  return {
    devices,
    selectedDeviceId,
    stream,
    loadDevices,
    startCamera,
    stopCamera
  }
}
