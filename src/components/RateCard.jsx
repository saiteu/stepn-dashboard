const TOKEN_META = {
  'go-game-token': {
    label: 'GGT',
    color: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/5',
  },
  stepn: {
    label: 'GMT',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
  },
  'polygon-ecosystem-token': {
    label: 'POL',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/5',
  },
}

function Change({ value }) {
  if (value == null) return null
  const up = value >= 0
  return (
    <span className={`text-xs font-mono ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  )
}

export function RateCard({ tokenId, data, loading, error }) {
  const meta = TOKEN_META[tokenId] ?? { label: tokenId, color: 'text-white', border: 'border-white/20', bg: 'bg-white/5' }

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4 flex flex-col gap-2`}>
      <div className={`text-lg font-bold ${meta.color}`}>{meta.label}</div>

      {loading && <div className="text-gray-500 text-sm animate-pulse">Loading…</div>}
      {error && <div className="text-red-400 text-xs">Error: {error}</div>}

      {data && !loading && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl text-white">${data.usd?.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
            <Change value={data.usd_24h_change} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-gray-300">¥{data.jpy?.toLocaleString('ja-JP', { maximumFractionDigits: 4 })}</span>
            <Change value={data.jpy_24h_change} />
          </div>
          {data.ggt_per_gmt != null && (
            <div className="font-mono text-xs text-gray-500">
              {data.ggt_per_gmt.toFixed(4)} GMT
            </div>
          )}
        </>
      )}
    </div>
  )
}
