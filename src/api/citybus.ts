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

export async function searchCitybusRoutes(route: string): Promise<RouteChoice[]> {
  const [routeRes, routeStopRes] = await Promise.all([
    fetch(`${BASE}/route/CTB/${route}`),
    fetch(`${BASE}/route-stop/CTB/${route}`)
  ])

  const routeJson = await routeRes.json()
  const routeStopJson = await routeStopRes.json()

  const routeList = asArray<any>(routeJson.data)
  const routeStopList = asArray<any>(routeStopJson.data)

  const stopGroups = new Map<string, number>()
  for (const item of routeStopList) {
    const key = `${item.bound}-${item.service_type}`
    stopGroups.set(key, (stopGroups.get(key) ?? 0) + 1)
  }

  return routeList.map((item: any) => ({
    route: item.route,
    bound: item.bound,
    serviceType: String(item.service_type ?? '1'),
    destination: item.dest_tc,
    origin: item.orig_tc
  }))
}

export async function getCitybusStops(
  route: string,
  bound: string,
  serviceType: string
): Promise<StopInfo[]> {
  const [routeStopRes, stopRes] = await Promise.all([
    fetch(`${BASE}/route-stop/CTB/${route}/${bound}/${serviceType}`),
    fetch(`${BASE}/stop`)
  ])

  const routeStopJson = await routeStopRes.json()
  const stopJson = await stopRes.json()

  const routeStopList = asArray<any>(routeStopJson.data)
  const stopList = asArray<any>(stopJson.data)

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
  const res = await fetch(`${BASE}/eta/CTB/${stopId}/${route}`)
  const json = await res.json()
  const etaList = asArray<any>(json.data)

  return etaList.slice(0, 3).map((item: any) => ({
    eta: item.eta ?? null,
    destination: item.dest_tc ?? item.dest_en ?? route,
    remark: item.rmk_tc ?? item.rmk_en ?? '',
    operator: 'ctb' as const
  }))
}