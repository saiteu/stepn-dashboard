import { useState } from 'react'

const today = () => new Date().toISOString().slice(0, 10)

export function RecordForm({ onAdd }) {
  const [form, setForm] = useState({ date: today(), type: 'earn', gst: '', steps: '' })
  const [err, setErr] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.gst || Number(form.gst) <= 0) {
      setErr('GST量は0より大きい値を入力してください')
      return
    }
    setErr('')
    onAdd({ ...form, gst: Number(form.gst), steps: Number(form.steps || 0) })
    setForm({ date: today(), type: 'earn', gst: '', steps: '' })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest">記録追加</div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">日付</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent/50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">種類</span>
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent/50"
            >
              <option value="earn">GST 獲得</option>
              <option value="spend">GST 消費</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">GST量 *</span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={form.gst}
              onChange={(e) => set('gst', e.target.value)}
              placeholder="0.000"
              className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-accent/50"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">歩数</span>
            <input
              type="number"
              min="0"
              value={form.steps}
              onChange={(e) => set('steps', e.target.value)}
              placeholder="0"
              className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-accent/50"
            />
          </label>
        </div>
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <button
          type="submit"
          className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent font-mono text-sm rounded-lg py-2 transition-colors"
        >
          追加
        </button>
      </form>
    </div>
  )
}
