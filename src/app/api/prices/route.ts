import { NextResponse } from 'next/server'

const NSE_SYMBOLS = [
  'RELIANCE', 'HDFCBANK', 'BHARTIARTL', 'TCS', 'ICICIBANK',
  'INFY', 'HINDUNILVR', 'ITC', 'SBIN', 'LT', 'ASIANPAINT', 'AXISBANK'
]

// Base prices for realistic fallback
const BASE_PRICES: Record<string, number> = {
  RELIANCE: 2950, HDFCBANK: 1720, BHARTIARTL: 1650, TCS: 4100,
  ICICIBANK: 1280, INFY: 1890, HINDUNILVR: 2400, ITC: 480,
  SBIN: 820, LT: 3600, ASIANPAINT: 2900, AXISBANK: 1180
}

async function fetchYahooPrice(symbol: string) {
  const yahooSymbol = `${symbol}.NS`
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=7d`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    next: { revalidate: 60 } // cache 60 seconds
  })

  if (!res.ok) throw new Error(`Yahoo fetch failed for ${symbol}`)

  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta
  const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
  const timestamps = json?.chart?.result?.[0]?.timestamp || []

  const currentPrice = meta?.regularMarketPrice || meta?.previousClose || BASE_PRICES[symbol]
  const prevClose = meta?.chartPreviousClose || meta?.previousClose || currentPrice
  const change = currentPrice - prevClose
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

  // Last 7 days of closes for sparkline
  const sparkline = closes
    .filter((v: number | null) => v !== null && v !== undefined)
    .slice(-7)
    .map((v: number) => Math.round(v))

  return {
    symbol,
    price: Math.round(currentPrice),
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
    prevClose: Math.round(prevClose),
    high: Math.round(meta?.regularMarketDayHigh || currentPrice * 1.01),
    low: Math.round(meta?.regularMarketDayLow || currentPrice * 0.99),
    volume: meta?.regularMarketVolume || 0,
    sparkline,
    marketCap: meta?.marketCap || 0,
    lastUpdated: new Date().toISOString()
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get('symbol')
  const symbols = symbolParam ? [symbolParam.toUpperCase()] : NSE_SYMBOLS

  const results = await Promise.allSettled(
    symbols.map(sym => fetchYahooPrice(sym))
  )

  const data: Record<string, any> = {}
  results.forEach((result, i) => {
    const sym = symbols[i]
    if (result.status === 'fulfilled') {
      data[sym] = result.value
    } else {
      // Realistic fallback with slight random variation
      const base = BASE_PRICES[sym] || 2000
      const change = (Math.random() - 0.45) * base * 0.02
      data[sym] = {
        symbol: sym,
        price: Math.round(base + change),
        change: Math.round(change * 100) / 100,
        changePct: Math.round((change / base) * 10000) / 100,
        prevClose: base,
        high: Math.round(base * 1.015),
        low: Math.round(base * 0.985),
        volume: Math.floor(Math.random() * 5000000) + 500000,
        sparkline: Array.from({ length: 7 }, (_, i) =>
          Math.round(base + (Math.random() - 0.5) * base * 0.03)
        ),
        marketCap: 0,
        lastUpdated: new Date().toISOString(),
        isFallback: true
      }
    }
  })

  return NextResponse.json({ success: true, data })
}
