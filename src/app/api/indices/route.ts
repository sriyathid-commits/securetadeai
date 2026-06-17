import { NextResponse } from 'next/server'

const INDICES = [
  { key: 'NIFTY50',   symbol: '%5ENSEI',   label: 'NIFTY 50',    base: 24500 },
  { key: 'SENSEX',    symbol: '%5EBSESN',  label: 'SENSEX',      base: 80500 },
  { key: 'BANKNIFTY', symbol: '%5ENSEBANK',label: 'BANK NIFTY',  base: 53000 },
  { key: 'NIFTYIT',   symbol: '%5ECNXIT',  label: 'NIFTY IT',    base: 42000 },
]

async function fetchIndex(symbol: string, label: string, base: number) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    next: { revalidate: 60 }
  })

  if (!res.ok) throw new Error(`Failed for ${label}`)

  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta

  const price = meta?.regularMarketPrice || meta?.previousClose || base
  const prevClose = meta?.chartPreviousClose || meta?.previousClose || base
  const change = price - prevClose
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

  return {
    label,
    price: Math.round(price),
    change: Math.round(change),
    changePct: Math.round(changePct * 100) / 100,
    isUp: change >= 0
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    INDICES.map(idx => fetchIndex(idx.symbol, idx.label, idx.base))
  )

  const data: Record<string, any> = {}
  INDICES.forEach((idx, i) => {
    const result = results[i]
    if (result.status === 'fulfilled') {
      data[idx.key] = result.value
    } else {
      const change = (Math.random() - 0.48) * idx.base * 0.01
      data[idx.key] = {
        label: idx.label,
        price: Math.round(idx.base + change),
        change: Math.round(change),
        changePct: Math.round((change / idx.base) * 10000) / 100,
        isUp: change >= 0,
        isFallback: true
      }
    }
  })

  return NextResponse.json({ success: true, data })
}
