export type Operator = 'kmb' | 'ctb'

export type RouteChoice = {
  route: string
  bound: string
  serviceType: string
  destination: string
  origin?: string
}

export type StopInfo = {
  stopId: string
  nameTc: string
  nameEn: string
  sequence?: number
}

export type EtaItem = {
  eta: string | null
  destination: string
  remark: string
  operator: Operator
}
