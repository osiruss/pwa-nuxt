
export type GuionRow = {
  _id: string
  nombre: string
  titulo: string
  texto: string
}

export type GuionRowsResponse = {
  rows: GuionRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const useTerms = () => {
  const config = useRuntimeConfig()

  const { data, pending, error, refresh } = useFetch<GuionRowsResponse>(
      'http://localhost:3001/tracking/guion',
     //`${config.public.apiBase}/tracking/guion`,
      { key: "guion-terms", server: false }
  )
  console.log('-------------------------------config.public.apiBase', config.public.apiBase)
  console.log("🚀 ~ useTerms ~ config.public:", config.public)
  const guion = computed(() => data.value?.rows?.[0] ?? null)

  const paragraphs = computed(() => {
    const raw = guion.value?.texto ?? ""
    const clean = raw.replace(/\r/g, "").trim()
    if (!clean) return []

    // si viene con saltos de línea reales
    if (clean.includes("\n\n")) {
      return clean.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
    }
    if (clean.includes("\n")) {
      return clean.split(/\n+/).map(s => s.trim()).filter(Boolean)
    }

    // fallback: separar por oración y agrupar de a 2
    const parts = clean.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
    const grouped: string[] = []
    for (let i = 0; i < parts.length; i += 2) {
      grouped.push([parts[i], parts[i + 1]].filter(Boolean).join(" "))
    }
    return grouped
  })

  return { guion, paragraphs, pending, error, refresh }
}