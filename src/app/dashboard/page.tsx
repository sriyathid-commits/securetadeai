"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const NSE_SYMBOLS = [
  'RELIANCE','HDFCBANK','BHARTIARTL','TCS','ICICIBANK',
  'INFY','HINDUNILVR','ITC','SBIN','LT','ASIANPAINT','AXISBANK'
]
const SECTORS: Record<string,string> = {
  RELIANCE:'Energy', HDFCBANK:'Banking', BHARTIARTL:'Telecom',
  TCS:'IT', ICICIBANK:'Banking', INFY:'IT', HINDUNILVR:'FMCG',
  ITC:'FMCG', SBIN:'Banking', LT:'Infrastructure',
  ASIANPAINT:'Consumer', AXISBANK:'Banking'
}

interface StockData {
  symbol:string; price:number; change:number; changePct:number
  prevClose:number; high:number; low:number; volume:number
  sparkline:number[]; isFallback?:boolean
}
interface IndexData {
  label:string; price:number; change:number; changePct:number; isUp:boolean
}
interface TradeSignal {
  symbol:string; riskLevel:'LOW'|'MEDIUM'|'HIGH'; esgScore:number
  recommendation:'BUY'|'HOLD'|'SELL'; keyRisk:string; tvSignal:string
  confidence:number; target:string; stoploss:string
  sentiment:string; aiServices:string[]
}
interface NewsItem { title:string; sentiment:'positive'|'negative'|'neutral'; source:string; age:string }
interface PortfolioEntry { symbol:string; qty:number; buyPrice:number }
interface PriceAlert { id:string; symbol:string; targetPrice:number; direction:'above'|'below'; triggered:boolean }

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, isUp }:{ data:number[]; isUp:boolean }) {
  if (!data || data.length < 2) return null
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={data.map((v,i)=>({i,v}))}>
        <Line type="monotone" dataKey="v" stroke={isUp?'#34d399':'#f87171'} strokeWidth={2} dot={false}/>
        <Tooltip contentStyle={{background:'#1e293b',border:'none',borderRadius:8,fontSize:11}}
          formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,''] } labelFormatter={()=>''}/>
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Ticker Tape ────────────────────────────────────────────────────────────
function TickerTape({ stocks }:{ stocks:Record<string,StockData> }) {
  const symbols = NSE_SYMBOLS.filter(s => stocks[s])
  if (symbols.length === 0) return null
  const items = [...symbols, ...symbols] // duplicate for seamless loop
  return (
    <div className="w-full bg-slate-950 border-b border-white/10 overflow-hidden py-2">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((sym, i) => {
          const d = stocks[sym]
          const isUp = d.changePct >= 0
          return (
            <span key={i} className="inline-flex items-center gap-2 px-6 text-sm font-mono">
              <span className="font-bold text-white">{sym}</span>
              <span className="text-slate-300">₹{d.price.toLocaleString()}</span>
              <span className={`font-bold ${isUp?'text-emerald-400':'text-red-400'}`}>
                {isUp?'▲':'▼'} {Math.abs(d.changePct).toFixed(2)}%
              </span>
              <span className="text-slate-600 ml-2">|</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Index Bar ──────────────────────────────────────────────────────────────
function IndexBar({ indices, lastUpdate }:{ indices:Record<string,IndexData>; lastUpdate:number }) {
  const [time, setTime] = useState('')
  useEffect(()=>{
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))
    tick()
    const t = setInterval(tick, 1000)
    return ()=>clearInterval(t)
  },[])
  return (
    <div className="w-full bg-slate-900/90 border-b border-white/10 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 items-center">
        <span className="text-xs text-emerald-400 font-bold animate-pulse">● LIVE</span>
        {Object.values(indices).map(idx=>(
          <div key={idx.label} className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-medium">{idx.label}</span>
            <span className="text-white font-bold text-sm tabular-nums">{idx.price.toLocaleString()}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${idx.isUp?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-400'}`}>
              {idx.isUp?'▲':'▼'} {Math.abs(idx.changePct).toFixed(2)}%
            </span>
          </div>
        ))}
        <span className="text-xs text-slate-500 ml-auto tabular-nums">{time} IST</span>
      </div>
    </div>
  )
}

// ── News Panel ─────────────────────────────────────────────────────────────
function NewsPanel({ news, sentiment }:{ news:NewsItem[]; sentiment:{label:string;score:number} }) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">📰 Latest News
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ml-auto ${
          sentiment.label.includes('Positive')?'bg-emerald-500/20 text-emerald-400':
          sentiment.label.includes('Negative')?'bg-red-500/20 text-red-400':'bg-yellow-500/20 text-yellow-400'
        }`}>{sentiment.label}</span>
      </h3>
      <div className="space-y-2">
        {news.map((item,i)=>(
          <div key={i} className={`p-3 rounded-xl border-l-4 ${
            item.sentiment==='positive'?'border-emerald-400 bg-emerald-500/10':
            item.sentiment==='negative'?'border-red-400 bg-red-500/10':'border-yellow-400 bg-yellow-500/10'
          }`}>
            <p className="text-sm text-slate-200 leading-snug mb-1">{item.title}</p>
            <div className="flex gap-2 text-xs text-slate-400"><span>{item.source}</span><span>·</span><span>{item.age}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sector Heatmap ─────────────────────────────────────────────────────────
function SectorHeatmap({ stocks }:{ stocks:Record<string,StockData> }) {
  const map: Record<string,{total:number;count:number}> = {}
  Object.entries(stocks).forEach(([sym,d])=>{
    const sec = SECTORS[sym]||'Other'
    if (!map[sec]) map[sec]={total:0,count:0}
    map[sec].total += d.changePct; map[sec].count++
  })
  const sectors = Object.entries(map).map(([name,v])=>({
    name, avg:Math.round((v.total/v.count)*100)/100, isUp:v.total/v.count>=0
  })).sort((a,b)=>b.avg-a.avg)
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4">🗺️ Sector Performance</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sectors.map(s=>(
          <div key={s.name} className={`rounded-xl p-4 text-center border ${
            s.avg>1?'bg-emerald-500/30 border-emerald-400/50':s.avg>0?'bg-emerald-500/15 border-emerald-400/30':
            s.avg>-1?'bg-red-500/15 border-red-400/30':'bg-red-500/30 border-red-400/50'
          }`}>
            <div className="font-bold text-sm">{s.name}</div>
            <div className={`text-lg font-black mt-1 ${s.isUp?'text-emerald-400':'text-red-400'}`}>
              {s.isUp?'+':''}{s.avg}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Portfolio Tracker ──────────────────────────────────────────────────────
function PortfolioTracker({ portfolio,stocks,onAdd,onRemove }:{
  portfolio:PortfolioEntry[]; stocks:Record<string,StockData>
  onAdd:(e:PortfolioEntry)=>void; onRemove:(s:string)=>void
}) {
  const [sym,setSym]=useState(''); const [qty,setQty]=useState(''); const [bp,setBp]=useState('')
  const invested = portfolio.reduce((s,p)=>s+p.qty*p.buyPrice,0)
  const current  = portfolio.reduce((s,p)=>s+p.qty*(stocks[p.symbol]?.price||p.buyPrice),0)
  const pnl = current-invested; const pct = invested>0?(pnl/invested)*100:0
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-3">💼 Portfolio Tracker</h2>
      <div className="flex gap-6 mb-4 flex-wrap">
        {[['Invested',`₹${Math.round(invested).toLocaleString()}`,'text-white'],
          ['Current',`₹${Math.round(current).toLocaleString()}`,'text-white'],
          ['P&L',`${pnl>=0?'+':''}₹${Math.round(pnl).toLocaleString()} (${pct.toFixed(1)}%)`,pnl>=0?'text-emerald-400':'text-red-400']
        ].map(([l,v,c])=>(
          <div key={String(l)}><div className="text-xs text-slate-400">{l}</div><div className={`text-lg font-bold ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={sym} onChange={e=>setSym(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400">
          <option value="">Select Stock</option>
          {NSE_SYMBOLS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="Qty" value={qty} onChange={e=>setQty(e.target.value)} className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"/>
        <input type="number" placeholder="Buy ₹" value={bp} onChange={e=>setBp(e.target.value)} className="w-28 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"/>
        <button onClick={()=>{if(sym&&qty&&bp){onAdd({symbol:sym,qty:Number(qty),buyPrice:Number(bp)});setSym('');setQty('');setBp('')}}} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold">+ Add</button>
      </div>
      <div className="space-y-2">
        {portfolio.map(p=>{
          const cur=stocks[p.symbol]?.price||p.buyPrice; const pl=(cur-p.buyPrice)*p.qty; const pc=((cur-p.buyPrice)/p.buyPrice)*100
          return (
            <div key={p.symbol} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 flex-wrap gap-2">
              <span className="font-bold">{p.symbol}</span>
              <span className="text-slate-400 text-sm">{p.qty}×₹{p.buyPrice}</span>
              <span className="font-semibold tabular-nums">₹{Math.round(cur).toLocaleString()}</span>
              <span className={`font-bold text-sm tabular-nums ${pl>=0?'text-emerald-400':'text-red-400'}`}>{pl>=0?'+':''}₹{Math.round(pl).toLocaleString()} ({pc.toFixed(1)}%)</span>
              <button onClick={()=>onRemove(p.symbol)} className="text-slate-500 hover:text-red-400 text-sm">✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Price Alerts ───────────────────────────────────────────────────────────
function PriceAlerts({ alerts,stocks,onAdd,onRemove }:{
  alerts:PriceAlert[]; stocks:Record<string,StockData>
  onAdd:(a:PriceAlert)=>void; onRemove:(id:string)=>void
}) {
  const [sym,setSym]=useState(''); const [price,setPrice]=useState(''); const [dir,setDir]=useState<'above'|'below'>('above')
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4">🔔 Price Alerts</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={sym} onChange={e=>setSym(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400">
          <option value="">Select Stock</option>{NSE_SYMBOLS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={dir} onChange={e=>setDir(e.target.value as 'above'|'below')} className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400">
          <option value="above">Goes Above</option><option value="below">Falls Below</option>
        </select>
        <input type="number" placeholder="₹ Price" value={price} onChange={e=>setPrice(e.target.value)} className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400"/>
        <button onClick={()=>{if(sym&&price){onAdd({id:`${sym}-${Date.now()}`,symbol:sym,targetPrice:Number(price),direction:dir,triggered:false});setSym('');setPrice('')}}} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">Set Alert</button>
      </div>
      {alerts.length===0&&<p className="text-slate-500 text-sm">No alerts set yet.</p>}
      <div className="space-y-2">
        {alerts.map(a=>{
          const cur=stocks[a.symbol]?.price
          return (
            <div key={a.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border flex-wrap gap-2 ${a.triggered?'bg-yellow-500/20 border-yellow-400/50':'bg-white/5 border-white/10'}`}>
              <span className="font-bold">{a.symbol}</span>
              <span className="text-slate-300 text-sm">{a.direction==='above'?'↑ Above':'↓ Below'} ₹{a.targetPrice.toLocaleString()}</span>
              {cur&&<span className="text-slate-400 text-xs tabular-nums">Now: ₹{cur.toLocaleString()}</span>}
              {a.triggered&&<span className="text-yellow-400 font-bold text-xs animate-pulse">🔔 TRIGGERED!</span>}
              <button onClick={()=>onRemove(a.id)} className="text-slate-500 hover:text-red-400 text-sm">✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function SecurTradeAIPro() {
  const [stocks, setStocks] = useState<Record<string,StockData>>({})
  const [indices, setIndices] = useState<Record<string,IndexData>>({})
  const [prevPrices, setPrevPrices] = useState<Record<string,number>>({})
  const [pulsing, setPulsing] = useState<Record<string,boolean>>({})
  const [lastUpdate, setLastUpdate] = useState(0)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TradeSignal|null>(null)
  const [symbol, setSymbol] = useState('RELIANCE')
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showVoice, setShowVoice] = useState(false)
  const [analyzingSymbol, setAnalyzingSymbol] = useState('')
  const [activeTab, setActiveTab] = useState<'market'|'portfolio'|'alerts'|'sectors'>('market')
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsSentiment, setNewsSentiment] = useState({label:'🟡 Neutral',score:50})
  const eventSourceRef = useRef<EventSource|null>(null)

  const [watchlist, setWatchlist] = useState<string[]>(()=>{
    if(typeof window!=='undefined'){const s=localStorage.getItem('watchlist');return s?JSON.parse(s):[]}
    return []
  })
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>(()=>{
    if(typeof window!=='undefined'){const s=localStorage.getItem('portfolio');return s?JSON.parse(s):[]}
    return []
  })
  const [alerts, setAlerts] = useState<PriceAlert[]>(()=>{
    if(typeof window!=='undefined'){const s=localStorage.getItem('priceAlerts');return s?JSON.parse(s):[]}
    return []
  })

  // ── SSE Connection ─────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close()
    const es = new EventSource('/api/stream')
    eventSourceRef.current = es
    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.error) return
        if (data.stocks) {
          setStocks(prev => {
            const newPulse: Record<string,boolean> = {}
            Object.entries(data.stocks).forEach(([sym, d]: [string, any]) => {
              if (prev[sym] && prev[sym].price !== d.price) newPulse[sym] = true
            })
            if (Object.keys(newPulse).length > 0) {
              setPrevPrices(p => ({ ...p, ...Object.fromEntries(Object.entries(prev).map(([k,v])=>[k,v.price])) }))
              setPulsing(p => ({ ...p, ...newPulse }))
              setTimeout(() => setPulsing(p => {
                const n = { ...p }; Object.keys(newPulse).forEach(k => delete n[k]); return n
              }), 800)
            }
            return data.stocks
          })
          setLastUpdate(data.ts || Date.now())
        }
        if (data.indices) setIndices(data.indices)
      } catch { /* ignore parse errors */ }
    }
    es.onerror = () => {
      setConnected(false)
      es.close()
      // Reconnect after 5s
      setTimeout(connectSSE, 5000)
    }
  }, [])

  useEffect(() => {
    connectSSE()
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    return () => { eventSourceRef.current?.close() }
  }, [connectSSE])

  // ── Check price alerts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!Object.keys(stocks).length || !alerts.length) return
    let changed = false
    const updated = alerts.map(a => {
      if (a.triggered) return a
      const cur = stocks[a.symbol]?.price
      if (!cur) return a
      const hit = a.direction==='above' ? cur>=a.targetPrice : cur<=a.targetPrice
      if (hit) {
        changed = true
        if ('Notification' in window && Notification.permission==='granted') {
          new Notification(`🔔 ${a.symbol} Alert!`, {
            body: `${a.symbol} ${a.direction==='above'?'crossed above':'fell below'} ₹${a.targetPrice.toLocaleString()}. Now ₹${cur.toLocaleString()}.`
          })
        }
        return { ...a, triggered: true }
      }
      return a
    })
    if (changed) { setAlerts(updated); localStorage.setItem('priceAlerts', JSON.stringify(updated)) }
  }, [stocks, alerts])

  // ── Persistence helpers ────────────────────────────────────────────────
  const addToWatchlist = (s:string) => setWatchlist(p=>{const n=p.includes(s)?p:[...p,s];localStorage.setItem('watchlist',JSON.stringify(n));return n})
  const removeFromWatchlist = (s:string) => setWatchlist(p=>{const n=p.filter(x=>x!==s);localStorage.setItem('watchlist',JSON.stringify(n));return n})
  const addPortfolio = (e:PortfolioEntry) => setPortfolio(p=>{const n=[...p.filter(x=>x.symbol!==e.symbol),e];localStorage.setItem('portfolio',JSON.stringify(n));return n})
  const removePortfolio = (s:string) => setPortfolio(p=>{const n=p.filter(x=>x.symbol!==s);localStorage.setItem('portfolio',JSON.stringify(n));return n})
  const addAlert = (a:PriceAlert) => setAlerts(p=>{const n=[...p,a];localStorage.setItem('priceAlerts',JSON.stringify(n));return n})
  const removeAlert = (id:string) => setAlerts(p=>{const n=p.filter(x=>x.id!==id);localStorage.setItem('priceAlerts',JSON.stringify(n));return n})

  // ── Fetch news ─────────────────────────────────────────────────────────
  const fetchNews = async (sym:string) => {
    try {
      const r = await fetch(`/api/news?symbol=${sym}`)
      const j = await r.json()
      if (j.success) { setNews(j.news||[]); setNewsSentiment(j.sentiment||{label:'🟡 Neutral',score:50}) }
    } catch { /* ignore */ }
  }

  // ── AI Analysis ────────────────────────────────────────────────────────
  const analyzeAzureTrade = async (company:string) => {
    setLoading(true); setError(''); setAnalyzingSymbol(company); setSymbol(company)
    fetchNews(company)
    try {
      const res = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:company})})
      const j = await res.json()
      const sd = stocks[company]
      setResult({
        symbol:company,
        riskLevel:(j.data?.risk==='High'?'HIGH':j.data?.risk==='Medium'?'MEDIUM':'LOW') as 'LOW'|'MEDIUM'|'HIGH',
        esgScore:75+Math.floor(Math.random()*20),
        recommendation:(j.data?.action||'HOLD') as 'BUY'|'HOLD'|'SELL',
        keyRisk:j.data?.reason||'Azure AI analysis complete',
        tvSignal:j.data?.reason||'Momentum detected',
        confidence:j.data?.confidence||78,
        target:j.data?.target||`₹${Math.round((sd?.price||3000)*1.08).toLocaleString()}`,
        stoploss:j.data?.stoploss||`₹${Math.round((sd?.price||3000)*0.96).toLocaleString()}`,
        sentiment:j.data?.sentiment||'🟢 Positive',
        aiServices:j.data?.aiServices||['🟦 Azure OpenAI','🟦 Azure Cognitive Services']
      })
      speechSynthesis.speak(new SpeechSynthesisUtterance(
        `${j.data?.action||'Hold'} ${company}. Target ${j.data?.target}. Confidence ${j.data?.confidence||78} percent.`
      ))
    } catch {
      const sd = stocks[company]
      setResult({symbol:company,riskLevel:'LOW',esgScore:80,recommendation:'BUY',
        keyRisk:'Azure AI fallback activated',tvSignal:'Bullish momentum',confidence:78,
        target:`₹${Math.round((sd?.price||3000)*1.08).toLocaleString()}`,
        stoploss:`₹${Math.round((sd?.price||3000)*0.96).toLocaleString()}`,
        sentiment:'🟢 Positive',aiServices:['🟦 Azure OpenAI']})
    } finally { setLoading(false); setAnalyzingSymbol('') }
  }

  // ── Voice Trading ──────────────────────────────────────────────────────
  const startVoiceTrading = async () => {
    setShowVoice(true)
    const SR = (window as any).webkitSpeechRecognition||(window as any).SpeechRecognition
    if (!SR) { await analyzeAzureTrade('RELIANCE'); setShowVoice(false); return }
    const r = new SR(); r.lang='en-IN'
    r.onresult = async (e:any) => {
      const cmd = e.results[0][0].transcript.toUpperCase()
      const m = cmd.match(/(BUY|SELL|ANALYZE)\s+([A-Z]+)/)
      await analyzeAzureTrade(m&&NSE_SYMBOLS.includes(m[2])?m[2]:'RELIANCE')
      setShowVoice(false)
    }
    r.onerror = () => { analyzeAzureTrade('RELIANCE'); setShowVoice(false) }
    r.onend = () => setShowVoice(false)
    r.start()
  }

  const filteredSymbols = NSE_SYMBOLS.filter(s=>s.toLowerCase().includes(searchQuery.toLowerCase()))

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      {/* Ticker Tape */}
      {Object.keys(stocks).length > 0 && <TickerTape stocks={stocks} />}
      {/* Index Bar */}
      {Object.keys(indices).length > 0 && <IndexBar indices={indices} lastUpdate={lastUpdate} />}

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="h-9 filter brightness-0 invert"/>
            <div className="bg-emerald-500/20 border-2 border-emerald-400 rounded-xl px-4 py-2">
              <span className="font-bold text-emerald-400">✅ Azure AI Powered</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${connected?'bg-emerald-500/20 border-emerald-400/50 text-emerald-400':'bg-red-500/20 border-red-400/50 text-red-400'}`}>
              {connected?'● LIVE STREAM':'○ Reconnecting…'}
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent mb-3">
            SecurTrade AI Pro
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto">Real-Time NSE · Azure AI · Voice · Portfolio · Alerts</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 rounded-2xl p-2 flex-wrap">
          {(['market','portfolio','alerts','sectors'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm capitalize transition-all ${activeTab===tab?'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg':'text-slate-400 hover:text-white hover:bg-white/10'}`}>
              {tab==='market'?'📈 Market':tab==='portfolio'?'💼 Portfolio':tab==='alerts'?'🔔 Alerts':'🗺️ Sectors'}
            </button>
          ))}
        </div>

        {/* MARKET TAB */}
        {activeTab==='market' && (
          <>
            <div className="flex gap-3 mb-6 flex-wrap">
              <input type="text" placeholder="Search symbols…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                className="flex-1 min-w-[180px] px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"/>
              <button onClick={startVoiceTrading} className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center gap-2">
                🎤 Voice Trade {showVoice&&<span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/>}
              </button>
            </div>

            {/* Stock Grid with pulse on price change */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
              {filteredSymbols.map(sym=>{
                const data=stocks[sym]; const isUp=(data?.changePct??0)>=0
                const isPulsing=pulsing[sym]; const inWL=watchlist.includes(sym)
                return (
                  <div key={sym} onClick={()=>analyzeAzureTrade(sym)}
                    className={`bg-white/10 backdrop-blur-sm border rounded-2xl p-5 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer relative overflow-hidden ${isPulsing?(isUp?'border-emerald-400 shadow-emerald-500/30 shadow-lg':'border-red-400 shadow-red-500/30 shadow-lg'):'border-white/20'}`}>
                    {analyzingSymbol===sym && <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">AI…</div>}
                    {isPulsing && <div className={`absolute inset-0 rounded-2xl opacity-20 animate-ping ${isUp?'bg-emerald-400':'bg-red-400'}`}/>}
                    <div className="flex justify-between items-start mb-2 relative">
                      <div>
                        <h3 className="text-lg font-bold">{sym}</h3>
                        <span className="text-xs text-slate-400">{SECTORS[sym]}</span>
                      </div>
                      <button onClick={e=>{e.stopPropagation();inWL?removeFromWatchlist(sym):addToWatchlist(sym)}}
                        className={`text-lg ${inWL?'text-yellow-400':'text-slate-500 hover:text-yellow-400'}`}>
                        {inWL?'⭐':'☆'}
                      </button>
                    </div>
                    <div className="mb-2 relative">
                      <div className={`text-2xl font-black tabular-nums transition-colors duration-300 ${isPulsing?(isUp?'text-emerald-300':'text-red-300'):'text-white'}`}>
                        {data?`₹${data.price.toLocaleString()}`:'—'}
                      </div>
                      <div className={`text-sm font-bold ${isUp?'text-emerald-400':'text-red-400'}`}>
                        {data?`${isUp?'▲':'▼'} ${Math.abs(data.changePct).toFixed(2)}%  ${isUp?'+':''}₹${data.change.toFixed(1)}`:'—'}
                      </div>
                    </div>
                    {data?.sparkline?.length>1 && <div className="mb-2 -mx-1"><Sparkline data={data.sparkline} isUp={isUp}/></div>}
                    <div className="flex justify-between text-xs text-slate-400 mb-3">
                      <span>H: {data?`₹${data.high.toLocaleString()}`:'—'}</span>
                      <span>L: {data?`₹${data.low.toLocaleString()}`:'—'}</span>
                    </div>
                    {data?.isFallback && <div className="text-xs text-slate-500 mb-1">⚡ Simulated</div>}
                    <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2 rounded-xl font-semibold text-sm">Analyze AI</button>
                  </div>
                )
              })}
            </div>

            {/* Watchlist */}
            {watchlist.length>0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">⭐ Watchlist ({watchlist.length})</h2>
                <div className="flex flex-wrap gap-3">
                  {watchlist.map(sym=>{
                    const d=stocks[sym]; const isUp=(d?.changePct??0)>=0
                    return (
                      <div key={sym} onClick={()=>analyzeAzureTrade(sym)} className="flex items-center gap-3 px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 cursor-pointer">
                        <span className="font-bold">{sym}</span>
                        {d&&<><span className="tabular-nums">₹{d.price.toLocaleString()}</span>
                        <span className={`text-xs font-bold ${isUp?'text-emerald-400':'text-red-400'}`}>{isUp?'▲':'▼'} {Math.abs(d.changePct).toFixed(2)}%</span></>}
                        <button onClick={e=>{e.stopPropagation();removeFromWatchlist(sym)}} className="text-slate-500 hover:text-red-400 text-xs">✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI Analysis Result */}
            {result && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-400/50 rounded-3xl p-8 mb-10">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">{result.symbol} Analysis</h2>
                    <div className="flex gap-3 flex-wrap text-sm">
                      <span className={`px-3 py-1 rounded-full font-bold border ${result.riskLevel==='LOW'?'bg-emerald-500/20 text-emerald-400 border-emerald-400/50':result.riskLevel==='MEDIUM'?'bg-yellow-500/20 text-yellow-400 border-yellow-400/50':'bg-red-500/20 text-red-400 border-red-400/50'}`}>{result.riskLevel} RISK</span>
                      <span className="text-emerald-400 font-bold">ESG: {result.esgScore}/100</span>
                      <span className="text-blue-400 font-bold">✅ Microsoft</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black tabular-nums">{stocks[result.symbol]?`₹${stocks[result.symbol].price.toLocaleString()}`:'—'}</div>
                    <div className={`text-lg font-bold ${(stocks[result.symbol]?.changePct??0)>=0?'text-emerald-400':'text-red-400'}`}>
                      {stocks[result.symbol]?`${stocks[result.symbol].changePct>=0?'▲ +':'▼ '}${stocks[result.symbol].changePct.toFixed(2)}%`:''}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                    <h3 className="font-bold mb-3">🤖 Recommendation</h3>
                    <div className={`text-4xl font-black p-3 rounded-xl mb-3 text-center ${result.recommendation==='BUY'?'bg-emerald-500/20 border-2 border-emerald-400':result.recommendation==='SELL'?'bg-red-500/20 border-2 border-red-400':'bg-yellow-500/20 border-2 border-yellow-400'}`}>{result.recommendation}</div>
                    <div className="text-sm text-slate-300">{result.tvSignal}</div>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                    <h3 className="font-bold mb-3">🎯 Trading Plan</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Target</span><span className="font-bold text-emerald-400">{result.target}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Stop Loss</span><span className="font-bold text-red-400">{result.stoploss}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Confidence</span><span className="font-bold text-blue-400">{result.confidence}%</span></div>
                    </div>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                    <h3 className="font-bold mb-3">💭 Sentiment</h3>
                    <div className="text-lg mb-2">{result.sentiment}</div>
                    <div className="flex flex-wrap gap-2">{result.aiServices.map((s,i)=><span key={i} className="px-2 py-1 bg-white/20 rounded-full text-xs border border-white/30">{s}</span>)}</div>
                  </div>
                </div>
                {news.length>0 && <div className="mb-6"><NewsPanel news={news} sentiment={newsSentiment}/></div>}
                <div className="bg-orange-500/10 border-2 border-orange-400/50 rounded-2xl p-5 mb-6">
                  <h3 className="font-bold text-orange-400 mb-2">⚠️ Key Risk</h3>
                  <p className="text-slate-200 text-sm leading-relaxed">{result.keyRisk}</p>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <button onClick={()=>analyzeAzureTrade(symbol)} disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-3">
                    {loading?<><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Analyzing…</>:'🔄 Re-Analyze'}
                  </button>
                  <button onClick={startVoiceTrading} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl">🎤 Voice</button>
                  <button onClick={()=>addToWatchlist(result.symbol)} className="px-6 py-3 bg-yellow-600/20 border border-yellow-400/50 text-yellow-400 font-bold rounded-2xl">⭐ Watch</button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab==='portfolio' && <PortfolioTracker portfolio={portfolio} stocks={stocks} onAdd={addPortfolio} onRemove={removePortfolio}/>}
        {activeTab==='alerts' && <PriceAlerts alerts={alerts} stocks={stocks} onAdd={addAlert} onRemove={removeAlert}/>}
        {activeTab==='sectors' && Object.keys(stocks).length>0 && <SectorHeatmap stocks={stocks}/>}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between text-sm text-slate-500">
          <div className="flex gap-4 flex-wrap">
            <span>🟢 {Object.keys(stocks).length}/{NSE_SYMBOLS.length} symbols</span>
            <span className={connected?'text-emerald-400':'text-red-400'}>{connected?'● SSE Live':'○ Reconnecting'}</span>
            <span>📡 Updates every 5s</span>
            {lastUpdate>0 && <span>Last: {new Date(lastUpdate).toLocaleTimeString('en-IN')}</span>}
          </div>
          {error && <span className="text-red-400 bg-red-500/20 px-4 py-1 rounded-xl">{error}</span>}
        </div>
      </div>

      {/* Voice Modal */}
      {showVoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/20 rounded-3xl p-8 text-center max-w-sm w-full mx-4">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl animate-pulse">🎤</div>
            <h3 className="text-2xl font-bold mb-3">Listening…</h3>
            <p className="text-slate-400 mb-6">Say "BUY RELIANCE" or "ANALYZE TCS"</p>
            <button onClick={()=>setShowVoice(false)} className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
