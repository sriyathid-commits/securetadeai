import yahooFinance from 'yahoo-finance2'

const NSE_SYMBOLS = [
  'RELIANCE','HDFCBANK','BHARTIARTL','TCS','ICICIBANK',
  'INFY','HINDUNILVR','ITC','SBIN','LT','ASIANPAINT','AXISBANK'
]
const INDEX_SYMBOLS = [
  { key:'NIFTY50',   symbol:'^NSEI',    label:'NIFTY 50',   base:24500 },
  { key:'SENSEX',    symbol:'^BSESN',   label:'SENSEX',     base:80500 },
  { key:'BANKNIFTY', symbol:'^NSEBANK', label:'BANK NIFTY', base:53000 },
  { key:'NIFTYIT',   symbol:'^CNXIT',   label:'NIFTY IT',   base:42000 },
]
const BASE: Record<string,number> = {
  RELIANCE:2950, HDFCBANK:1720, BHARTIARTL:1650, TCS:4100,
  ICICIBANK:1280, INFY:1890, HINDUNILVR:2400, ITC:480,
  SBIN:820, LT:3600, ASIANPAINT:2900, AXISBANK:1180
}

async function fetchAllPrices() {
  const stockResults = await Promise.allSettled(
    NSE_SYMBOLS.map(async sym => {
      try {
        const q = await yahooFinance.quote(`${sym}.NS`) as any
        const price:number = q.regularMarketPrice ?? BASE[sym]
        const prev:number  = q.regularMarketPreviousClose ?? price
        const change = price - prev
        return {
          symbol:sym, price:Math.round(price*100)/100,
          change:Math.round(change*100)/100,
          changePct:Math.round((change/prev)*10000)/100,
          high:Math.round(q.regularMarketDayHigh ?? price*1.01),
          low:Math.round(q.regularMarketDayLow ?? price*0.99),
          volume:q.regularMarketVolume??0, isFallback:false
        }
      } catch {
        const base=BASE[sym]; const drift=(Math.random()-0.48)*base*0.008
        return { symbol:sym, price:Math.round((base+drift)*100)/100,
          change:Math.round(drift*100)/100,
          changePct:Math.round((drift/base)*10000)/100,
          high:Math.round((base+drift)*1.01), low:Math.round((base+drift)*0.99),
          volume:Math.floor(Math.random()*3000000)+200000, isFallback:true }
      }
    })
  )

  const indexResults = await Promise.allSettled(
    INDEX_SYMBOLS.map(async idx => {
      try {
        const q = await yahooFinance.quote(idx.symbol) as any
        const price:number = q.regularMarketPrice ?? idx.base
        const prev:number  = q.regularMarketPreviousClose ?? price
        const change = price - prev
        return { key:idx.key, label:idx.label, price:Math.round(price),
          change:Math.round(change), changePct:Math.round((change/prev)*10000)/100, isUp:change>=0 }
      } catch {
        const drift=(Math.random()-0.48)*idx.base*0.006
        return { key:idx.key, label:idx.label, price:Math.round(idx.base+drift),
          change:Math.round(drift), changePct:Math.round((drift/idx.base)*10000)/100,
          isUp:drift>=0, isFallback:true }
      }
    })
  )

  const stocks:Record<string,any>={}
  stockResults.forEach((r,i)=>{
    stocks[NSE_SYMBOLS[i]] = r.status==='fulfilled' ? r.value :
      { symbol:NSE_SYMBOLS[i], price:BASE[NSE_SYMBOLS[i]], change:0, changePct:0, high:0, low:0, volume:0, isFallback:true }
  })

  const indices:Record<string,any>={}
  indexResults.forEach((r,i)=>{
    const idx=INDEX_SYMBOLS[i]
    indices[idx.key] = r.status==='fulfilled' ? r.value :
      { key:idx.key, label:idx.label, price:idx.base, change:0, changePct:0, isUp:true, isFallback:true }
  })

  return { stocks, indices, ts:Date.now() }
}

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (data:any) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) }
        catch { closed=true }
      }
      try { send(await fetchAllPrices()) }
      catch { send({ error:'initial fetch failed', ts:Date.now() }) }

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return }
        try { send(await fetchAllPrices()) }
        catch { send({ error:'fetch failed', ts:Date.now() }) }
      }, 5000)

      setTimeout(() => {
        closed=true; clearInterval(interval)
        try { controller.close() } catch { /* already closed */ }
      }, 10*60*1000)
    }
  })
  return new Response(stream, {
    headers: {
      'Content-Type':'text/event-stream',
      'Cache-Control':'no-cache, no-transform',
      'Connection':'keep-alive',
      'X-Accel-Buffering':'no',
    }
  })
}
