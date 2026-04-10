import type { EtaItem, RouteChoice, StopInfo } from '../types'

const BASE = 'https://data.etabus.gov.hk/v1/transport/kmb'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeKmbDirection(bound: string): string {
  const value = String(bound).toUpperCase()

  if (value === 'O') return 'outbound'
  if (value === 'I') return 'inbound'

  return bound
}

async function getJson(url: string) {
  const res = await fetch(url)
  const json = await res.json()

  console.log('[KMB API]', url, json)

  if (!res.ok) {
    throw new Error(json?.message || `KMB API error: ${res.status}`)
  }

  return json
}

export async function searchKmbRoutes(route: string): Promise<RouteChoice[]> {
  const json = await getJson(`${BASE}/route/`)
  const routeList = asArray<any>(json?.data)

  return routeList
    .filter((item: any) => item.route?.toUpperCase() === route.toUpperCase())
    .map((item: any) => ({
      route: item.route,
      bound: item.bound ?? '',
      serviceType: String(item.service_type ?? '1'),
      destination: item.dest_tc ?? item.dest_en ?? '',
      origin: item.orig_tc ?? item.orig_en ?? ''
    }))
}

export async function getKmbStops(
  route: string,
  bound: string,
  serviceType: string
): Promise<StopInfo[]> {
  const direction = normalizeKmbDirection(bound)
  const routeStopUrl = `${BASE}/route-stop/${route}/${direction}/${serviceType}`

  console.log('[KMB route-stop params]', {
    route,
    bound,
    direction,
    serviceType,
    routeStopUrl
  })

  const routeStopJson = await getJson(routeStopUrl)
  const routeStopList = asArray<any>(routeStopJson?.data)

  return routeStopList.map((item: any, index: number) => ({
    stopId: item.stop ?? `kmb-${index}`,
    sequence: item.seq,
    nameTc: item.name_tc ?? item.stop ?? `站點 ${index + 1}`,
    nameEn: item.name_en ?? item.stop ?? `Stop ${index + 1}`
  }))
}

export async function getKmbEta(
  stopId: string,
  route: string,
  serviceType: string
): Promise<EtaItem[]> {
  const json = await getJson(`${BASE}/eta/${stopId}/${route}/${serviceType}`)
  const etaList = asArray<any>(json?.data)

  return etaList.slice(0, 3).map((item: any) => ({
    eta: item.eta ?? null,
    destination: item.dest_tc ?? item.dest_en ?? route,
    remark: item.rmk_tc ?? item.rmk_en ?? '',
    operator: 'kmb' as const
  }))
}