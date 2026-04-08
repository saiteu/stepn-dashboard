import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function buildChartData(activities) {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  const byDate = {}
  for (const a of activities) {
    if (a.date) byDate[a.date] = (byDate[a.date] ?? 0) + Number(a.gst_earned ?? 0)
  }

  return days.map((date) => ({
    date: date.slice(5),
    gst: byDate[date] ?? 0,
  }))
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
      <div className="text-gray-400">{label}</div>
      <div className="text-accent">{payload[0].value.toFixed(3)} GST</div>
    </div>
  )
}

export function EarningsChart({ activities }) {
  const data = buildChartData(activities)

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">GST収益 (直近30日)</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a26" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="gst"
            stroke="#00e5a0"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00e5a0' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
