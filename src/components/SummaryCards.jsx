function Card({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-1">
      <div className="text-xs text-gray-500 uppercase tracking-widest">{label}</div>
      <div className="font-mono text-2xl text-accent">{value}</div>
      {sub && <div className="font-mono text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

export function SummaryCards({ activities, gstJpy }) {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const totalGst = activities.reduce((s, a) => s + Number(a.gst_earned ?? 0), 0)
  const totalDist = activities.reduce((s, a) => s + Number(a.distance_km ?? 0), 0)
  const totalMint = activities.reduce((s, a) => s + Number(a.mint_quarter ?? 0), 0)

  const monthActivities = activities.filter((a) => a.date?.startsWith(thisMonth))
  const monthGst = monthActivities.reduce((s, a) => s + Number(a.gst_earned ?? 0), 0)
  const monthDays = new Set(monthActivities.map((a) => a.date)).size

  const jpySub = gstJpy
    ? `≈ ¥${Math.round(totalGst * gstJpy).toLocaleString('ja-JP')}`
    : undefined

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card
        label="累計GST収益"
        value={`${totalGst.toFixed(2)}`}
        sub={jpySub}
      />
      <Card
        label="今月の収益"
        value={`${monthGst.toFixed(2)} GST`}
        sub={`${monthDays}日活動`}
      />
      <Card
        label="総距離"
        value={`${totalDist.toFixed(1)} km`}
      />
      <Card
        label="ミントクォーター"
        value={totalMint.toString()}
        sub="累計"
      />
    </div>
  )
}
