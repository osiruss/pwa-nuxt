import { ref, computed, watch, onMounted, type Ref } from "vue"

export type GuionRow = {
  _id: string
  nombre: string
  titulo: string
  texto: string
  fechaRegistro?: string
}

export type GuionRowsResponse = {
  rows: GuionRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** =========================
 *  IndexedDB minimal KV store
 *  ========================= */
const DB_NAME = "afiliacion-offline"
const STORE_NAME = "kv"
const CACHE_KEY = "guion:v1"

// variables del guion (persisten para que no se pierdan si recargas)
const VARS_LS_KEY = "afiliacion:guionVars:v1"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME) // ✅ sin versión

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }

    req.onsuccess = () => {
      const db = req.result

      // ✅ si falta el store, forzamos upgrade version+1
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const nextVersion = (db.version || 1) + 1
        db.close()

        const req2 = indexedDB.open(DB_NAME, nextVersion)
        req2.onupgradeneeded = () => {
          const db2 = req2.result
          if (!db2.objectStoreNames.contains(STORE_NAME)) db2.createObjectStore(STORE_NAME)
        }
        req2.onsuccess = () => resolve(req2.result)
        req2.onerror = () => reject(req2.error)
        return
      }

      resolve(db)
    }

    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | null> {
  if (!import.meta.client) return null
  const db = await openDb()
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => resolve((req.result ?? null) as T | null)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  if (!import.meta.client) return
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(value as any, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** =========================
 *  Texto -> párrafos
 *  ========================= */
function splitToParagraphs(raw: string): string[] {
  const clean = (raw || "").replace(/\r/g, "").trim()
  if (!clean) return []

  if (clean.includes("\n\n")) return clean.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
  if (clean.includes("\n")) return clean.split(/\n+/).map(s => s.trim()).filter(Boolean)

  const parts = clean.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
  const grouped: string[] = []
  for (let i = 0; i < parts.length; i += 2) grouped.push([parts[i], parts[i + 1]].filter(Boolean).join(" "))
  return grouped
}

function applyTemplate(text: string, vars: Record<string, string>) {
  return (text || "").replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
    const v = vars[key]
    return (v ?? "").trim() || `{{${key}}}` // si no está, deja el token visible
  })
}

/** =========================
 *  Composable
 *  ========================= */
export const useTerms = (onlineRef?: Ref<boolean> | (() => boolean) | boolean) => {
  const config = useRuntimeConfig()

  const guion = ref<GuionRow | null>(null)
  const pendingx = ref(false)
  const error = ref<unknown>(null)
  const source = ref<"api" | "cache" | "none">("none")


  const vars = ref<Record<string, string>>({
    nombre: "",
    nombreEjecutivo: "",
    rutAfiliado: "",
    fecha: "",
    hora: ""
  })

  // cargar vars desde localStorage
  const loadVars = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(VARS_LS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object") vars.value = { ...vars.value, ...parsed }
    } catch {
      // ignore
    }
  }

  const saveVars = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(VARS_LS_KEY, JSON.stringify(vars.value))
    } catch {
      // ignore
    }
  }

  function setVar(key: string, value: string) {
    vars.value = { ...vars.value, [key]: value ?? "" }
    saveVars()
  }

  function resetVars() {
    vars.value = {
      nombre: "",
      nombreEjecutivo: "",
      rutAfiliado: "",
      fecha: "",
      hora: ""
    }
    saveVars()
  }

  // ✅ texto final renderizado (con reemplazos)
  const renderedTitle = computed(() => applyTemplate(guion.value?.titulo ?? "", vars.value))
  const renderedText = computed(() => applyTemplate(guion.value?.texto ?? "", vars.value))

  // ✅ ahora los párrafos salen del texto renderizado (ya reemplazado)
  const paragraphs = computed(() => splitToParagraphs(renderedText.value))

  const readCache = async () => {
    const cached = await idbGet<GuionRow>(CACHE_KEY)
    if (cached) {
      guion.value = cached
      source.value = "cache"
    }
    return cached
  }

  const writeCache = async (doc: GuionRow) => {
    await idbSet(CACHE_KEY, doc)
  }

  const isOnline = () => {
    if (typeof onlineRef === "boolean") return onlineRef
    if (typeof onlineRef === "function") return !!onlineRef()
    if (onlineRef && typeof (onlineRef as any).value !== "undefined") return !!(onlineRef as any).value
    if (import.meta.client) return navigator.onLine !== false
    return true
  }

  const refresh = async () => {
    pendingx.value = true
    error.value = null
    source.value = "none"

    // OFFLINE: solo cache
    if (!isOnline()) {
      await readCache()
      pendingx.value = false
      return
    }

    // ONLINE: API → cache; si falla, cache
    try {
      const res = await $fetch<GuionRowsResponse>("/tracking/guion", {
        baseURL: "https://v9k9214s-3001.brs.devtunnels.ms" // config.public.apiBase
      })

      const doc = res?.rows?.[0] ?? null
      guion.value = doc
      source.value = doc ? "api" : "none"

      if (doc) await writeCache(doc)
    } catch (e) {
      error.value = e
      const cached = await readCache()
      if (!cached) source.value = "none"
    } finally {
      pendingx.value = false
    }
  }

  if (import.meta.client) {
    onMounted(async () => {
      loadVars()

      // pinta cache rápido
      await readCache()

      // si estás online (ping), pega a API
      if (isOnline()) await refresh()
    })

    // cuando pase OFFLINE -> ONLINE, pega al API
    if (onlineRef && typeof onlineRef !== "boolean") {
      watch(
        () => (typeof onlineRef === "function" ? onlineRef() : (onlineRef as any).value),
        (now: boolean, prev: boolean) => {
          if (!prev && now) refresh()
        }
      )
    }
  }

  return {
    guion,
    renderedTitle,
    renderedText,
    paragraphs,
    vars,
    setVar,
    resetVars,
    pendingx,
    error,
    source,
    refresh
  }
}