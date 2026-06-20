import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

const NSE_SYMBOLS = [
  'RELIANCE', 'HDFCBANK', 'BHARTIARTL', 'TCS', 'ICICIBANK',
  'INFY', 'HINDUNILVR', 'ITC', 'SBIN', 'LT', 'ASIANPAINT', 'AXISBANK'
]

const BASE_PRICES: Record<string, number> = {
  RELIANCE: 2950, HDFCBANK: 1720, BHARTIARTL: 1650, TCS: 4100,
  ICICIBANK: 1280, INFY: 1890, HINDUNILVR: 2400, ITC: 480,
  SBIN: 820, LT: 3600, ASIANPAINT: 2900, AXISBANK: 1180
}

async function fetchQuote(symbol: string) {
  const yahooSymbol = `${symbol}.NS`
  try {
    const quote = await yahooFinance.quote(yahooSymbol)
    const price = quote.regularMarketPrice ?? BASE_PRICES[symbol]
    const prevClose = quote.regularMarketPreviousClose ?? price
    const change = price - prevClose
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

    // fetch 7-day history for sparkline
    let sparkline: number[] = []
    try {
      const chart = await yahooFinance.chart(yahooSymbol, {
        period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        interval: '1d'
      })
      sparkline = (chart.quotes ?? [])
        .map((q: any) => Math.round(q.close ?? 0))
        .filter((v: number) => v > 0)
    } catch { /* sparkline optional */ }

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      prevClose: Math.round(prevClose),
      high: Math.round(quote.regularMarketDayHigh ?? price * 1.01),
      low: Math.round(quote.regularMarketDayLow ?? price * 0.99),
      volume: quote.regularMarketVolume ?? 0,
      marketCap: quote.marketCap ?? 0,
      sparkline,
      lastUpdated: new Date().toISOString(),
      isFallback: false
    }
  } catch {
    const base = BASE_PRICES[symbol] ?? 2000
    const drift = (Math.random() - 0.48) * base * 0.015
    const price = Math.round(base + drift)
    const change = Math.round(drift * 100) / 100
    return {
      symbol,
      price,
      change,
      changePct: Math.round((drift / base) * 10000) / 100,
      prevClose: base,
      high: Math.round(price * 1.012),
      low: Math.round(price * 0.988),
      volume: Math.floor(Math.random() * 5000000) + 500000,
      marketCap: 0,
      sparkline: Array.from({ length: 7 }, () =>
        Math.round(base + (Math.random() - 0.5) * base * 0.025)
      ),
      lastUpdated: new Date().toISOString(),
      isFallback: true
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get('symbol')
  const symbols = symbolParam ? [symbolParam.toUpperCase()] : NSE_SYMBOLS

  const results = await Promise.allSettled(symbols.map(fetchQuote))

  const data: Record<string, any> = {}
  results.forEach((r, i) => {
    data[symbols[i]] = r.status === 'fulfilled' ? r.value : {
      symbol: symbols[i], price: BASE_PRICES[symbols[i]] ?? 2000,
      change: 0, changePct: 0, prevClose: BASE_PRICES[symbols[i]] ?? 2000,
      high: 0, low: 0, volume: 0, marketCap: 0, sparkline: [],
      lastUpdated: new Date().toISOString(), isFallback: true
    }
  })

  return NextResponse.json({ success: true, data })
}
