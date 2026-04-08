function StatBar({ label, value, max = 10, color = 'bg-accent' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-gray-400 w-4 text-right">{value}</span>
    </div>
  )
}

const TYPE_COLORS = {
  Walker: 'text-blue-400 border-blue-400/30',
  Jogger: 'text-green-400 border-green-400/30',
  Runner: 'text-orange-400 border-orange-400/30',
  Trainer: 'text-purple-400 border-purple-400/30',
}

export function ShoeCard({ shoe, onEdit, onDelete }) {
  const typeColor = TYPE_COLORS[shoe.type] ?? 'text-gray-400 border-white/20'
  const dur = shoe.durability ?? 0
  const durPct = Math.min(100, dur)

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-3 relative">
      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={() => onEdit(shoe)}
          className="text-gray-600 hover:text-accent transition-colors text-xs"
          aria-label="編集"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(shoe.id)}
          className="text-gray-600 hover:text-red-400 transition-colors text-xs"
          aria-label="削除"
        >
          ✕
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 pr-10">
        <span className="text-white font-medium truncate">{shoe.name}</span>
        <span className={`text-xs border rounded px-1.5 py-0.5 flex-shrink-0 ${typeColor}`}>{shoe.type}</span>
        <span className="text-xs text-gray-500 font-mono ml-auto flex-shrink-0">Lv.{shoe.level}</span>
      </div>

      {/* Durability bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>耐久度</span>
          <span className="font-mono">{dur} / 100</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${durPct > 50 ? 'bg-green-400' : durPct > 25 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${durPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1.5">
        <StatBar label="効率" value={shoe.efficiency ?? 0} color="bg-accent" />
        <StatBar label="幸運" value={shoe.luck ?? 0} color="bg-amber-400" />
        <StatBar label="快適" value={shoe.comfort ?? 0} color="bg-blue-400" />
      </div>
    </div>
  )
}
