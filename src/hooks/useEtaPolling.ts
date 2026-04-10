import { useEffect, useState } from 'react'
import type { EtaItem } from '../types'

export function useEtaPolling(fetcher: (() => Promise<EtaItem[]>) | null, intervalMs = 30000) {
  const [data, setData] = useState<EtaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!fetcher) return
    let active = true
    let timer: number | undefined

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await fetcher()
        if (!active) return
        setData(result)
        setUpdatedAt(new Date())
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : '讀取 ETA 失敗')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    timer = window.setInterval(load, intervalMs)
    return () => {
      active = false
      if (timer) window.clearInterval(timer)
    }
  }, [fetcher, intervalMs])

  return { data, loading, error, updatedAt }
}
