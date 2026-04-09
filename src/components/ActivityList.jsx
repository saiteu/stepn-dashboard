import { useState } from 'react'

const PAGE_SIZE = 20

function MintBadge({ value }) {
  if (!value) return null
  return (
    <span className="text-xs font-mono bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded px-1.5 py-0.5">
      Mint ×{value}
    </span>
  )
}

export function ActivityList({ activities, loading, error }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(activities.length / PAGE_SIZE)
  const slice = activities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-bg2 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">活動一覧</div>
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-widest">活動一覧</div>
        {activities.length > 0 && (
          <span className="text-xs text-gray-500 font-mono">{activities.length} 件</span>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && activities.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-6">活動データがありません</p>
      )}

      {!loading && slice.length > 0 && (
        <>
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-x-4 px-3 text-xs text-gray-600 font-mono">
            <span>日付</span>
            <span className="text-right">距離</span>
            <span className="text-right">時間</span>
            <span className="text-right">GST</span>
            <span className="text-right">Mint</span>
            <span className="text-right">靴</span>
          </div>

          <ul className="flex flex-col gap-1.5">
            {slice.map((a) => (
              <li
                key={a.id}
                className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-x-4 gap-y-0.5 items-center bg-bg3 rounded-lg px-3 py-2.5 text-sm"
              >
                <span className="font-mono text-gray-400 text-xs">{a.date}</span>
                <span className="font-mono text-white text-right hidden sm:block">
                  {Number(a.distance_km).toFixed(2)} km
                </span>
                <span className="font-mono text-gray-400 text-xs text-right hidden sm:block">
                  {a.duration?.slice(0, 5)}
                </span>
                <span className="font-mono text-accent text-right hidden sm:block">
                  +{Number(a.gst_earned).toFixed(3)}
                </span>
                <div className="hidden sm:flex justify-end">
                  <MintBadge value={a.mint_quarter} />
                </div>
                <span className="text-xs text-gray-500 text-right hidden sm:block capitalize">
                  {a.shoe_type?.toLowerCase()}
                </span>

                {/* Mobile single-line summary */}
                <div className="flex items-center justify-between sm:hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white">{Number(a.distance_km).toFixed(2)} km</span>
                    <span className="font-mono text-xs text-gray-400">{a.duration?.slice(0, 5)}</span>
                  </div>
                  <span className="font-mono text-accent text-sm">+{Number(a.gst_earned).toFixed(3)} GST</span>
                </div>
                <div className="sm:hidden flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-600 capitalize">{a.shoe_type?.toLowerCase()}</span>
                  <MintBadge value={a.mint_quarter} />
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs font-mono text-gray-500 hover:text-white disabled:opacity-30 border border-white/10 rounded px-3 py-1 transition-colors"
              >
                ← 前
              </button>
              <span className="text-xs font-mono text-gray-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="text-xs font-mono text-gray-500 hover:text-white disabled:opacity-30 border border-white/10 rounded px-3 py-1 transition-colors"
              >
                次 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
