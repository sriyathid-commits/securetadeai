import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            SecurTrade AI
          </span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
            PRO
          </span>
        </div>
        <Link href="/dashboard"
          className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all text-sm">
          Open Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="flex items-center gap-3 mb-8">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
            alt="Microsoft" className="h-8 filter brightness-0 invert opacity-80" />
          <span className="text-slate-400 text-sm">Powered by Azure AI</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            Trade Smarter
          </span>
          <br />
          <span className="text-white">with AI</span>
        </h1>

        <p className="text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed">
          Real-time NSE prices, Azure AI-powered BUY/SELL signals, portfolio tracking,
          price alerts, and voice trading — all in one place.
        </p>

        <Link href="/dashboard"
          className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xl rounded-2xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-400/40 transform hover:-translate-y-1 transition-all duration-200">
          Launch Dashboard 🚀
        </Link>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-12">
          {[
            '📈 Live NSE Prices', '🤖 Azure AI Signals', '🎤 Voice Trading',
            '💼 Portfolio Tracker', '🔔 Price Alerts', '🗺️ Sector Heatmap',
            '📰 News & Sentiment', '⭐ Smart Watchlist'
          ].map(f => (
            <span key={f} className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-slate-300">
              {f}
            </span>
          ))}
        </div>
      </main>

      {/* Stats bar */}
      <div className="border-t border-white/10 px-8 py-5">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-8 justify-center text-center">
          {[
            { val: '12+', label: 'NSE Stocks' },
            { val: '3', label: 'Azure AI Services' },
            { val: 'Live', label: 'Real-Time Prices' },
            { val: 'PWA', label: 'Works on Mobile' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-black text-emerald-400">{s.val}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-slate-600 py-4 px-6">
        For educational purposes only. Not financial advice. Past performance does not guarantee future results.
      </div>
    </div>
  )
}
