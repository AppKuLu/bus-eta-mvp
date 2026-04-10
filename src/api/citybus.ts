import type { EtaItem, RouteChoice, StopInfo } from '../types'

const BASE = 'https://rt.data.gov.hk/v2/transport/citybus'

type CitybusStopLookup = {
  stop: string
  name_tc?: string
  name_en?: string
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

async function getJson(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  console.log('[CTB API]', url, json)

  if (!res.ok) {
    throw new Error(`Citybus API error: ${res.status}`)
  }

  return json
}

export async function searchCitybusRoutes(route: string): Promise<RouteChoice[]> {
  const routeJson = await getJson(`${BASE}/route/CTB/${route}`)

  const rawRouteData = routeJson?.data
  const routeList = Array.isArray(rawRouteData)
    ? rawRouteData
    : rawRouteData
      ? [rawRouteData]
      : []

  return routeList.map((item: any) => ({
    route: item.route,
    bound: item.bound,
    serviceType: String(item.service_type ?? '1'),
    destination: item.dest_tc ?? item.dest_en ?? '',
    origin: item.orig_tc ?? item.orig_en ?? ''
  }))
}

export async function getCitybusStops(
  route: string,
  bound: string,
  serviceType: string
): Promise<StopInfo[]> {
  const [routeStopJson, stopJson] = await Promise.all([
    getJson(`${BASE}/route-stop/CTB/${route}/${bound}/${serviceType}`),
    getJson(`${BASE}/stop`)
  ])

  const routeStopList = asArray<any>(routeStopJson?.data)
  const stopList = asArray<any>(stopJson?.data)

  const stopMap = new Map<string, CitybusStopLookup>(
    stopList.map((stop: any) => [stop.stop, stop])
  )

  return routeStopList.map((item: any) => {
    const stop = stopMap.get(item.stop)

    return {
      stopId: item.stop,
      sequence: item.seq,
      nameTc: stop?.name_tc ?? item.stop,
      nameEn: stop?.name_en ?? item.stop
    }
  })
}

export async function getCitybusEta(stopId: string, route: string): Promise<EtaItem[]> {
  const json = await getJson(`${BASE}/eta/CTB/${stopId}/${route}`)
  const etaList = asArray<any>(json?.data)

  return etaList.slice(0, 3).map((item: any) => ({
    eta: item.eta ?? null,
    destination: item.dest_tc ?? item.dest_en ?? route,
    remark: item.rmk_tc ?? item.rmk_en ?? '',
    operator: 'ctb' as const
  }))
}