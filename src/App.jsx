import { useRates } from './hooks/useRates'
import { useActivities } from './hooks/useActivities'
import { RateCard } from './components/RateCard'
import { SummaryCards } from './components/SummaryCards'
import { EarningsChart } from './components/EarningsChart'
import { MintQuarterStats } from './components/MintQuarterStats'
import { ActivityList } from './components/ActivityList'

const TOKEN_IDS = ['green-satoshi-token-bsc', 'stepn', 'solana']

function formatUpdatedAt(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false })
}

export default function App() {
  const { rates, updatedAt, loading: ratesLoading, error: ratesError, refetch } = useRates()
  const { activities, loading: activitiesLoading, error: activitiesError, refetch: refetchActivities } = useActivities()

  const gstJpy = rates?.['green-satoshi-token-bsc']?.jpy

  return (
    <div className="min-h-screen bg-bg text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-accent font-bold text-xl tracking-tight">STEPN</span>
            <span className="text-gray-600 text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs text-gray-500 font-mono hidden sm:block">
                更新: {formatUpdatedAt(updatedAt)}
              </span>
            )}
            <button
              onClick={() => { refetch(); refetchActivities() }}
              className="text-xs text-gray-500 hover:text-accent transition-colors font-mono border border-white/10 rounded px-2 py-1"
            >
              ↻ 更新
            </button>
          </div>
        </header>

        {/* Rate Cards */}
        <section>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">レート</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TOKEN_IDS.map((id) => (
              <RateCard
                key={id}
                tokenId={id}
                data={rates?.[id]}
                loading={ratesLoading}
                error={ratesError}
              />
            ))}
          </div>
        </section>

        {/* Summary Cards */}
        <section>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">サマリー</div>
          <SummaryCards activities={activities} gstJpy={gstJpy} />
        </section>

        {/* Earnings Chart */}
        <EarningsChart activities={activities} />

        {/* Mint Quarter Stats */}
        <MintQuarterStats activities={activities} />

        {/* Activity List */}
        <ActivityList
          activities={activities}
          loading={activitiesLoading}
          error={activitiesError}
        />

      </div>
    </div>
  )
}
