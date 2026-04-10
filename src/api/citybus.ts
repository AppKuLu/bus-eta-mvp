import type { EtaItem, RouteChoice, StopInfo } from '../types'

const BASE = 'https://rt.data.gov.hk/v2/transport/citybus'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

async function getJson(url: string) {
  const res = await fetch(url)
  const json = await res.json()

  console.log('[CTB API]', url, json)

  if (!res.ok) {
    throw new Error(json?.message || `Citybus API error: ${res.status}`)
  }

  return json
}

export async function searchCitybusRoutes(route: string): Promise<RouteChoice[]> {
  const routeJson = await getJson(`${BASE}/route/CTB/${route}`)

  const raw = routeJson?.data
  const routeList = Array.isArray(raw) ? raw : raw ? [raw] : []

  return routeList.map((item: any) => ({
    route: item.route,
    bound: item.bound ?? item.dir ?? '',
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
  if (!bound) {
    throw new Error('Citybus route bound 缺失，無法讀取站點')
  }

  const routeStopUrl = `${BASE}/route-stop/CTB/${route}/${bound}/${serviceType}`

  console.log('[CTB route-stop params]', {
    route,
    bound,
    serviceType,
    routeStopUrl
  })

  const routeStopJson = await getJson(routeStopUrl)
  const routeStopList = asArray<any>(routeStopJson?.data)

  return routeStopList.map((item: any, index: number) => ({
    stopId: item.stop ?? `ctb-${index}`,
    sequence: item.seq,
    nameTc: item.name_tc ?? item.stop ?? `站點 ${index + 1}`,
    nameEn: item.name_en ?? item.stop ?? `Stop ${index + 1}`
  }))
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