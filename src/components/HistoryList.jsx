export function HistoryList({ records, onDelete }) {
  const recent = records.slice(0, 10)

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-3">
      <div className="text-xs text-gray-500 uppercase tracking-widest">履歴（直近10件）</div>
      {recent.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-4">記録がありません</p>
      )}
      <ul className="flex flex-col gap-2">
        {recent.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg bg-bg3 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  r.type === 'earn' ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="font-mono text-gray-400 text-xs">{r.date}</span>
              <span
                className={`font-mono font-medium ${
                  r.type === 'earn' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {r.type === 'earn' ? '+' : '-'}{Number(r.gst).toFixed(3)} GST
              </span>
              {r.steps > 0 && (
                <span className="text-gray-600 text-xs font-mono">{Number(r.steps).toLocaleString()} steps</span>
              )}
            </div>
            <button
              onClick={() => onDelete(r.id)}
              className="text-gray-600 hover:text-red-400 transition-colors text-xs px-2 py-1"
              aria-label="削除"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
