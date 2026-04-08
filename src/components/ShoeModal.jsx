import { useState, useEffect } from 'react'

const TYPES = ['Walker', 'Jogger', 'Runner', 'Trainer']

const EMPTY = {
  name: '',
  type: 'Walker',
  level: 1,
  durability: 100,
  efficiency: 1,
  luck: 1,
  comfort: 1,
}

function NumField({ label, name, value, min = 0, max, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        className="bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent/50 w-full"
      />
    </label>
  )
}

export function ShoeModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm((f) => ({ ...f, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
    onClose()
  }

  const isEdit = !!initial

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-bg2 border border-white/10 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">
            {isEdit ? 'シューズを編集' : 'シューズを追加'}
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-sm"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">名前 *</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jogger #1042"
              required
              className="bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent/50"
            />
          </label>

          {/* Type + Level */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">種類</span>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent/50"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <NumField label="レベル" name="level" value={form.level} min={0} max={30} onChange={handleChange} />
          </div>

          {/* Durability */}
          <NumField label="耐久度 (0–100)" name="durability" value={form.durability} min={0} max={100} onChange={handleChange} />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <NumField label="効率" name="efficiency" value={form.efficiency} min={0} max={10} onChange={handleChange} />
            <NumField label="幸運" name="luck" value={form.luck} min={0} max={10} onChange={handleChange} />
            <NumField label="快適" name="comfort" value={form.comfort} min={0} max={10} onChange={handleChange} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-white/10 text-gray-400 hover:text-white text-sm rounded-lg py-2 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent text-sm rounded-lg py-2 transition-colors"
            >
              {isEdit ? '保存' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
