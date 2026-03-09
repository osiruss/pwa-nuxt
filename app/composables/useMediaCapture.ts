import { ref, nextTick, type Ref } from 'vue'

export function useMediaCapture(args: {
  rut: Ref<string>
  termsAccepted: Ref<boolean>
  selectedDeviceId: Ref<string>
  videoEl: Ref<HTMLVideoElement | null>

  primePermissions: () => Promise<void>
  loadVideoDevices: () => Promise<void>

  replaceVideoOnItem: (item: any, patch: any) => Promise<any>
  refreshPending: () => Promise<void>

  setMsg: (t: string) => void
  scrollToTopAnchor: () => void
  scrollToPreview: () => void
  cleanupPreview: () => void

  idbPut: (doc: any) => Promise<any>
  pending: Ref<any[]>
  lastPreviewUrl: Ref<string>
  editingId: Ref<string | null>
  editingOriginal: Ref<any | null>
}) {
  const cameraOn = ref(false)
  const recording = ref(false)
  const chunks = ref<Blob[]>([])

  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null

  function uuid(): string {
    return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  async function bindStreamToVideo(currentStream: MediaStream) {
    if (!args.videoEl.value) {
      await nextTick()
    }

    if (!args.videoEl.value) {
      console.warn('[camera] videoEl sigue null después de nextTick')
      throw new Error('No se encontró el elemento de video para mostrar la cámara.')
    }

    args.videoEl.value.srcObject = currentStream
    args.videoEl.value.muted = true
    args.videoEl.value.playsInline = true

    try {
      await args.videoEl.value.play()
    } catch (e) {
      console.warn('[camera] video.play() falló, reintentando...', e)
      await nextTick()
      await args.videoEl.value.play()
    }
  }

  async function startCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return args.setMsg('Este navegador no soporta getUserMedia.')
      }

      if (stream) {
        stopCamera(false)
      }

      await args.primePermissions()
      await args.loadVideoDevices()

      const wantDeviceId = args.selectedDeviceId.value?.trim()
      const videoConstraints: MediaTrackConstraints = wantDeviceId
        ? { deviceId: { exact: wantDeviceId } }
        : { facingMode: { ideal: 'environment' } }

      console.log('[camera] solicitando getUserMedia', {
        wantDeviceId,
        videoConstraints
      })

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true
        })
      } catch (primaryError) {
        console.warn('[camera] fallback a video:true', primaryError)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
      }

      if (!stream) {
        throw new Error('No se pudo obtener el stream de cámara.')
      }

      cameraOn.value = true

      await bindStreamToVideo(stream)

      console.log('[camera] stream enlazado correctamente', {
        videoElExists: !!args.videoEl.value,
        hasSrcObject: !!args.videoEl.value?.srcObject,
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          label: t.label,
          readyState: t.readyState
        }))
      })

      args.setMsg('Cámara activa.')
      args.scrollToTopAnchor()
    } catch (e: any) {
      console.error('[camera] startCamera error', e)
      cameraOn.value = false

      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
        stream = null
      }

      if (args.videoEl.value) {
        args.videoEl.value.srcObject = null
      }

      args.setMsg(`Error al abrir cámara: ${e?.message ?? e}`)
    }
  }

  function stopCamera(showMessage = true) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }

    if (args.videoEl.value) {
      args.videoEl.value.srcObject = null
    }

    cameraOn.value = false

    if (showMessage) {
      args.setMsg('Cámara detenida.')
    }
  }

  function pickMimeType(): string {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ]

    for (const c of candidates) {
      if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c
    }

    return 'video/webm'
  }

  async function startRecording() {
    if (!stream) {
      return args.setMsg('Primero debes encender la cámara.')
    }

    if (!args.rut.value) {
      return args.setMsg('Debes ingresar el RUT antes de grabar.')
    }

    chunks.value = []
    const mimeType = pickMimeType()

    try {
      recorder = new MediaRecorder(stream, { mimeType })
    } catch {
      recorder = new MediaRecorder(stream)
    }

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data && ev.data.size > 0) {
        chunks.value.push(ev.data)
      }
    }

    recorder.onstop = async () => {
      recording.value = false

      const blob = new Blob(chunks.value, {
        type: recorder?.mimeType || 'video/webm'
      })

      args.cleanupPreview()
      args.lastPreviewUrl.value = URL.createObjectURL(blob)

      if (args.editingId.value) {
        const current =
          args.pending.value.find((x: any) => x.id === args.editingId.value) ||
          args.editingOriginal.value

        if (!current) {
          args.editingId.value = null
          args.editingOriginal.value = null
          stopCamera()
          return args.setMsg('No encontré el pendiente a editar.')
        }

        await args.replaceVideoOnItem(current, {
          chunks: [...chunks.value],
          mimeType: recorder?.mimeType || 'video/webm',
          keepConfirmedAt: false
        })

        args.editingId.value = null
        args.editingOriginal.value = null

        args.setMsg('Video actualizado. Revisa y CONFIRMA nuevamente para habilitar envío.')
        stopCamera()
        args.scrollToPreview()
        return
      }

      const item: any = {
        id: uuid(),
        rut: args.rut.value,
        createdAt: Date.now(),
        status: 'review',
        confirmedAt: null,
        mimeType: recorder?.mimeType || 'video/webm',
        chunks: [...chunks.value]
      }

      await args.idbPut(item)
      await args.refreshPending()
      args.setMsg('Grabación guardada. Revisa y CONFIRMA para dejar listo para envío.')
      stopCamera()
      args.scrollToPreview()
    }

    recorder.start(1000)
    recording.value = true
    args.setMsg('Grabando...')
  }

  function stopRecording() {
    if (recorder && recording.value) {
      recorder.stop()
    }
  }

  async function fileToChunks(file: File, chunkSize = 1024 * 1024) {
    const out: Blob[] = []
    let offset = 0

    while (offset < file.size) {
      out.push(file.slice(offset, offset + chunkSize, file.type))
      offset += chunkSize
    }

    return out
  }

  async function attachFile(file: File) {
    if (!args.rut.value) {
      return args.setMsg('Debes ingresar el RUT antes de adjuntar un video.')
    }

    try {
      args.setMsg(`Adjuntando video: ${file.name}...`)

      const mimeType = file.type || 'video/mp4'
      const chunksArr = await fileToChunks(file)

      if (args.editingId.value) {
        const current =
          args.pending.value.find((x: any) => x.id === args.editingId.value) ||
          args.editingOriginal.value

        if (!current) {
          args.editingId.value = null
          args.editingOriginal.value = null
          return args.setMsg('No encontré el pendiente a editar.')
        }

        await args.replaceVideoOnItem(current, {
          chunks: chunksArr,
          mimeType,
          keepConfirmedAt: false
        })

        args.editingId.value = null
        args.editingOriginal.value = null

        args.setMsg('Video adjuntado y actualizado. Revisa y CONFIRMA nuevamente.')
        return
      }

      const item: any = {
        id: uuid(),
        rut: args.rut.value,
        createdAt: Date.now(),
        status: 'review',
        confirmedAt: null,
        mimeType,
        chunks: chunksArr
      }

      await args.idbPut(item)
      await args.refreshPending()

      args.setMsg('Video adjuntado y guardado OFFLINE. Revisa y CONFIRMA para dejar listo para envío.')
    } catch (e: any) {
      args.setMsg(`Error adjuntando video: ${e?.message ?? e}`)
    }
  }

  return {
    cameraOn,
    recording,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    attachFile
  }
}