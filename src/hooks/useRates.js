import { useState, useEffect, useCallback } from 'react'

const RATES_URL =
  'https://gist.githubusercontent.com/saiteu/e22508f07d33d27720159220816ea28e/raw/stepn_rates.json'

export function useRates() {
  const [rates, setRates] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(RATES_URL + '?t=' + Date.now())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const { updated_at, ...rest } = data
      setRates(rest)
      setUpdatedAt(updated_at)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  return { rates, updatedAt, loading, error, refetch: fetchRates }
}
