import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function recentMonths(n = 6) {
  const months = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    months.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

function buildData(activities) {
  const months = recentMonths(6)
  return months.map((month) => {
    const count = activities
      .filter((a) => a.date?.startsWith(month) && Number(a.mint_quarter ?? 0) > 0)
      .reduce((s, a) => s + Number(a.mint_quarter), 0)
    return { month: month.slice(5), count }
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
      <div className="text-gray-400">{label}</div>
      <div className="text-amber-400">{payload[0].value} mint quarter</div>
    </div>
  )
}

export function MintQuarterStats({ activities }) {
  const data = buildData(activities)
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-widest">ミントクォーター (直近6ヶ月)</div>
        {total > 0 && (
          <span className="font-mono text-xs text-amber-400">{total} 回計</span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a26" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar
            dataKey="count"
            name="mint quarter"
            fill="#fbbf24"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>

      {total === 0 && (
        <p className="text-gray-600 text-sm text-center pb-2">ミントクォーターなし</p>
      )}
    </div>
  )
}
