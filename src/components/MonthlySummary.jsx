import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// 直近 N ヶ月の "YYYY-MM" 文字列を新しい順に返す
function recentMonths(n = 6) {
  const months = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    months.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

function buildMonthlyData(records) {
  const months = recentMonths(6)
  return months.map((month) => {
    const monthRecords = records.filter((r) => r.date?.startsWith(month))
    const earned = monthRecords
      .filter((r) => r.type === 'earn')
      .reduce((s, r) => s + Number(r.gst ?? 0), 0)
    const spent = monthRecords
      .filter((r) => r.type === 'spend')
      .reduce((s, r) => s + Number(r.gst ?? 0), 0)
    const activeDays = new Set(monthRecords.map((r) => r.date)).size
    return { month: month.slice(5), earned, spent, net: earned - spent, activeDays }
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg3 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono flex flex-col gap-1">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(3)} GST
        </div>
      ))}
    </div>
  )
}

export function MonthlySummary({ records, gstJpy }) {
  const data = buildMonthlyData(records)
  const hasData = data.some((d) => d.earned > 0 || d.spent > 0)

  return (
    <div className="rounded-xl border border-white/10 bg-bg2 p-4 flex flex-col gap-5">
      <div className="text-xs text-gray-500 uppercase tracking-widest">月別収益サマリー</div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a26" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6b7280' }}
          />
          <Bar dataKey="earned" name="獲得" fill="#00e5a0" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="spent" name="消費" fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs font-mono border-collapse min-w-[480px]">
          <thead>
            <tr className="text-gray-500 border-b border-white/5">
              <th className="text-left py-2 px-2 font-normal">月</th>
              <th className="text-right py-2 px-2 font-normal">獲得 GST</th>
              <th className="text-right py-2 px-2 font-normal">消費 GST</th>
              <th className="text-right py-2 px-2 font-normal">純収益</th>
              <th className="text-right py-2 px-2 font-normal">活動日数</th>
              {gstJpy && <th className="text-right py-2 px-2 font-normal">JPY換算</th>}
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((row) => {
              const isPositive = row.net >= 0
              return (
                <tr key={row.month} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-2 text-gray-400">{row.month}</td>
                  <td className="py-2 px-2 text-right text-accent">
                    {row.earned > 0 ? `+${row.earned.toFixed(3)}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-red-400">
                    {row.spent > 0 ? `-${row.spent.toFixed(3)}` : '—'}
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${isPositive ? 'text-accent' : 'text-red-400'}`}>
                    {row.net === 0 ? '—' : `${isPositive ? '+' : ''}${row.net.toFixed(3)}`}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-400">
                    {row.activeDays > 0 ? `${row.activeDays}日` : '—'}
                  </td>
                  {gstJpy && (
                    <td className="py-2 px-2 text-right text-gray-400">
                      {row.net !== 0
                        ? `¥${Math.round(row.net * gstJpy).toLocaleString('ja-JP')}`
                        : '—'}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!hasData && (
        <p className="text-gray-600 text-sm text-center py-2">記録がありません</p>
      )}
    </div>
  )
}
