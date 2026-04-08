import { useState } from 'react'

const STORAGE_KEY = 'stepn_energy'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { hp: 100, durability: 85, activity: 60 }
  } catch {
    return { hp: 100, durability: 85, activity: 60 }
  }
}

function ProgressRow({ label, value, max, color, onChange }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-gray-300">{value} / {max}</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current h-1 cursor-pointer"
        style={{ accentColor: color.replace('bg-', '').includes('accent') ? '#00e5a0' : undefined }}
      />
    </div>
  )
}

export function EnergyPanel() {
  const [energy, setEnergy] = useState(load)

  const set = (key, val) => {
    setEnergy((prev) => {
      const next = { ...prev, [key]: val }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest">エネルギー</div>
      <ProgressRow
        label="HP"
        value={energy.hp}
        max={100}
        color="bg-red-400"
        onChange={(v) => set('hp', v)}
      />
      <ProgressRow
        label="耐久度"
        value={energy.durability}
        max={100}
        color="bg-amber-400"
        onChange={(v) => set('durability', v)}
      />
      <ProgressRow
        label="運動量"
        value={energy.activity}
        max={100}
        color="bg-accent"
        onChange={(v) => set('activity', v)}
      />
    </div>
  )
}
