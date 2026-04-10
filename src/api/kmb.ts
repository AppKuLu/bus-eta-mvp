import type { EtaItem, RouteChoice, StopInfo } from '../types'

const BASE = 'https://data.etabus.gov.hk/v1/transport/kmb'

type KmbStopLookup = {
  stop: string
  name_tc?: string
  name_en?: string
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

export async function searchKmbRoutes(route: string): Promise<RouteChoice[]> {
  const res = await fetch(`${BASE}/route/`)
  const json = await res.json()
  const routeList = asArray<any>(json.data)

  return routeList
    .filter((item: any) => item.route?.toUpperCase() === route.toUpperCase())
    .map((item: any) => ({
      route: item.route,
      bound: item.bound,
      serviceType: String(item.service_type ?? '1'),
      destination: item.dest_tc,
      origin: item.orig_tc
    }))
}

export async function getKmbStops(
  route: string,
  bound: string,
  serviceType: string
): Promise<StopInfo[]> {
  const [routeStopRes, stopRes] = await Promise.all([
    fetch(`${BASE}/route-stop/${route}/${bound}/${serviceType}`),
    fetch(`${BASE}/stop`)
  ])

  const routeStopJson = await routeStopRes.json()
  const stopJson = await stopRes.json()

  const routeStopList = asArray<any>(routeStopJson.data)
  const stopList = asArray<any>(stopJson.data)

  const stopMap = new Map<string, KmbStopLookup>(
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

export async function getKmbEta(
  stopId: string,
  route: string,
  serviceType: string
): Promise<EtaItem[]> {
  const res = await fetch(`${BASE}/eta/${stopId}/${route}/${serviceType}`)
  const json = await res.json()
  const etaList = asArray<any>(json.data)

  return etaList.slice(0, 3).map((item: any) => ({
    eta: item.eta ?? null,
    destination: item.dest_tc ?? item.dest_en ?? route,
    remark: item.rmk_tc ?? item.rmk_en ?? '',
    operator: 'kmb' as const
  }))
}