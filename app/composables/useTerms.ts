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
const DB_VERSION = 2
const STORE_NAME = "kv"
const CACHE_KEY = "guion:v1"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // ✅ abre sin versión => abre la versión más alta existente
    const req = indexedDB.open(DB_NAME)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }

    req.onsuccess = () => {
      const db = req.result

      // ✅ si abrió pero NO existe el store, forzamos upgrade a version+1
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

/** =========================
 *  Composable
 *  =========================
 *  onlineRef: boolean que viene de tu ping (computed/ref)
 */
export const useTerms = (onlineRef?: Ref<boolean> | (() => boolean) | boolean) => {
  const config = useRuntimeConfig()

  const guion = ref<GuionRow | null>(null)
  const pendingx = ref(false)
  const error = ref<unknown>(null)
  const source = ref<"api" | "cache" | "none">("none")

  const paragraphs = computed(() => splitToParagraphs(guion.value?.texto ?? ""))

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
    // prioridad: el online que tú pasas (ping)
    if (typeof onlineRef === "boolean") return onlineRef
    if (typeof onlineRef === "function") return !!onlineRef()
    if (onlineRef && typeof (onlineRef as any).value !== "undefined") return !!(onlineRef as any).value

    // fallback: navigator (por si no pasaste nada)
    if (import.meta.client) return navigator.onLine !== false
    return true
  }

  const refresh = async () => {
    pendingx.value = true
    error.value = null
    source.value = "none"

    // OFFLINE (por ping): solo cache
    if (!isOnline()) {
      await readCache()
      pendingx.value = false
      return
    }

    // ONLINE: API → cache; si falla, fallback cache
    try {
      const res = await $fetch<GuionRowsResponse>("/tracking/guion", {
        baseURL: 'http://localhost:3001' //config.public.apiBase
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
  // 1) al montar: pinta cache inmediato, y si estás online por ping, pega al API
  onMounted(async () => {
    await readCache()
    if (isOnline()) await refresh()
  })

  // 2) cuando pase de OFFLINE -> ONLINE (por ping), pega al API
  if (onlineRef && typeof onlineRef !== "boolean") {
    watch(
      () => (typeof onlineRef === "function" ? onlineRef() : (onlineRef as any).value),
      (now: boolean, prev: boolean) => {
        if (!prev && now) refresh()
      }
    )
  }
}

  return { guion, paragraphs, pendingx, error, source, refresh }
}