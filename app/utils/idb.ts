export type StoredCaseStatus = 'review' | 'ready' | 'error'

export type StoredCase = {
  id: string
  rut: string
  createdAt: number
  status: StoredCaseStatus
  mimeType: string
  chunks: Blob[]
  confirmedAt?: number | null
  lastError?: string | null
}

const DB_NAME = 'afiliacion-offline'
const STORE = 'cases'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // ✅ abre sin versión: toma la versión más alta existente
    const req = indexedDB.open(DB_NAME)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" })
        store.createIndex("status", "status", { unique: false })
        store.createIndex("createdAt", "createdAt", { unique: false })
      }
    }

    req.onsuccess = () => {
      const db = req.result

      // ✅ si abrió pero NO existe el store (DB vieja creada sin "cases"),
      // forzamos upgrade a version+1 para crearlo
      if (!db.objectStoreNames.contains(STORE)) {
        const nextVersion = (db.version || 1) + 1
        db.close()

        const req2 = indexedDB.open(DB_NAME, nextVersion)
        req2.onupgradeneeded = () => {
          const db2 = req2.result
          if (!db2.objectStoreNames.contains(STORE)) {
            const store = db2.createObjectStore(STORE, { keyPath: "id" })
            store.createIndex("status", "status", { unique: false })
            store.createIndex("createdAt", "createdAt", { unique: false })
          }
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


function toPlain(item: StoredCase): StoredCase {
  // ⚠️ chunks puede venir como Proxy (array reactivo). Lo convertimos a Array real.
  const rawChunks = (item as any).chunks
  const chunksArray: Blob[] = Array.isArray(rawChunks) ? Array.from(rawChunks) : []

  return {
    id: (item as any).id,
    rut: (item as any).rut,
    createdAt: (item as any).createdAt,
    status: (item as any).status,
    mimeType: (item as any).mimeType,

    // ✅ clave del fix:
    chunks: chunksArray,

    confirmedAt: (item as any).confirmedAt ?? null,
    lastError: (item as any).lastError ?? null
  }
}


export async function idbPut(item: StoredCase): Promise<void> {
  const db = await openDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)

    const safeItem = toPlain(item)

    store.put(safeItem)

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  db.close()
}

export async function idbGetAll(): Promise<StoredCase[]> {
  const db = await openDb()

  const items = await new Promise<StoredCase[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()

    req.onsuccess = () => resolve((req.result as StoredCase[]) ?? [])
    req.onerror = () => reject(req.error)
  })

  db.close()
  return items
}

export async function idbGet(id: string): Promise<StoredCase | null> {
  const db = await openDb()

  const item = await new Promise<StoredCase | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)

    req.onsuccess = () => resolve((req.result as StoredCase) ?? null)
    req.onerror = () => reject(req.error)
  })

  db.close()
  return item
}

export async function idbDelete(id: string): Promise<void> {
  const db = await openDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  db.close()
}
