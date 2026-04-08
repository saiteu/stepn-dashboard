import { useState, useCallback } from 'react'

const STORAGE_KEY = 'stepn_records'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

export function useRecords() {
  const [records, setRecords] = useState(load)

  const save = (next) => {
    setRecords(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const addRecord = useCallback((record) => {
    const next = [{ ...record, id: crypto.randomUUID() }, ...load()]
    save(next)
  }, [])

  const deleteRecord = useCallback((id) => {
    save(load().filter((r) => r.id !== id))
  }, [])

  return { records, addRecord, deleteRecord }
}
