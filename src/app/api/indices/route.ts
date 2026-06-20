import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

const INDICES = [
  { key: 'NIFTY50',    symbol: '^NSEI',    label: 'NIFTY 50',   base: 24500 },
  { key: 'SENSEX',     symbol: '^BSESN',   label: 'SENSEX',     base: 80500 },
  { key: 'BANKNIFTY',  symbol: '^NSEBANK', label: 'BANK NIFTY', base: 53000 },
  { key: 'NIFTYIT',   symbol: '^CNXIT',   label: 'NIFTY IT',   base: 42000 },
]

export async function GET() {
  const results = await Promise.allSettled(
    INDICES.map(async idx => {
      try {
        const quote = await yahooFinance.quote(idx.symbol) as any
        const price = (quote.regularMarketPrice as number) ?? idx.base
        const prevClose = (quote.regularMarketPreviousClose as number) ?? price
        const change = price - prevClose
        const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0
        return {
          label: idx.label,
          price: Math.round(price),
          change: Math.round(change),
          changePct: Math.round(changePct * 100) / 100,
          isUp: change >= 0
        }
      } catch {
        const drift = (Math.random() - 0.48) * idx.base * 0.008
        return {
          label: idx.label,
          price: Math.round(idx.base + drift),
          change: Math.round(drift),
          changePct: Math.round((drift / idx.base) * 10000) / 100,
          isUp: drift >= 0,
          isFallback: true
        }
      }
    })
  )

  const data: Record<string, any> = {}
  INDICES.forEach((idx, i) => {
    const r = results[i]
    data[idx.key] = r.status === 'fulfilled' ? r.value : {
      label: idx.label, price: idx.base, change: 0,
      changePct: 0, isUp: true, isFallback: true
    }
  })

  return NextResponse.json({ success: true, data })
}
