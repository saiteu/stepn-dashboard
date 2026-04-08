import { useState, useCallback } from 'react'

const STORAGE_KEY = 'stepn_shoes'

const DEFAULT_SHOES = [
  {
    id: '1',
    name: 'Walker #1',
    type: 'Walker',
    level: 5,
    durability: 85,
    maxDurability: 100,
    efficiency: 4,
    luck: 2,
    comfort: 1,
  },
]

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_SHOES
  } catch {
    return DEFAULT_SHOES
  }
}

export function useShoes() {
  const [shoes, setShoes] = useState(load)

  const save = (next) => {
    setShoes(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const addShoe = useCallback((shoe) => {
    save([...load(), { ...shoe, id: crypto.randomUUID() }])
  }, [])

  const updateShoe = useCallback((id, patch) => {
    save(load().map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const deleteShoe = useCallback((id) => {
    save(load().filter((s) => s.id !== id))
  }, [])

  return { shoes, addShoe, updateShoe, deleteShoe }
}
