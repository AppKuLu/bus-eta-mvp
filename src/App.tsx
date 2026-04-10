import { useMemo, useState } from 'react'
import { getCitybusEta, getCitybusStops, searchCitybusRoutes } from './api/citybus'
import { getKmbEta, getKmbStops, searchKmbRoutes } from './api/kmb'
import { Logo } from './components/Logo'
import { ThemeToggle } from './components/ThemeToggle'
import { useEtaPolling } from './hooks/useEtaPolling'
import { formatTime, minutesAway } from './lib/time'
import type { Operator, RouteChoice, StopInfo } from './types'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  const [operator, setOperator] = useState<Operator>('kmb')
  const [route, setRoute] = useState('')
  const [routes, setRoutes] = useState<RouteChoice[]>([])
  const [selectedRoute, setSelectedRoute] = useState<RouteChoice | null>(null)
  const [stops, setStops] = useState<StopInfo[]>([])
  const [selectedStop, setSelectedStop] = useState<StopInfo | null>(null)

  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [loadingStops, setLoadingStops] = useState(false)
  const [error, setError] = useState('')

  const resetResults = () => {
    setRoutes([])
    setSelectedRoute(null)
    setSelectedStop(null)
    setStops([])
  }

  const searchRoutes = async () => {
    const keyword = route.trim().toUpperCase()

    if (!keyword) {
      setError('請先輸入路線號碼')
      resetResults()
      return
    }

    try {
      setLoadingRoutes(true)
      setError('')
      resetResults()

      const result =
        operator === 'kmb'
          ? await searchKmbRoutes(keyword)
          : await searchCitybusRoutes(keyword)

      setRoutes(result)

      if (result.length === 0) {
        setError('未搜尋或未找到路線。')
      }
    } catch (err) {
      resetResults()
      setError(err instanceof Error ? err.message : '搜尋路線失敗')
    } finally {
      setLoadingRoutes(false)
    }
  }

  const chooseRoute = async (choice: RouteChoice) => {
    try {
      setLoadingStops(true)
      setError('')
      setSelectedRoute(choice)
      setSelectedStop(null)
      setStops([])

      const result =
        operator === 'kmb'
          ? await getKmbStops(choice.route, choice.bound, choice.serviceType)
          : await getCitybusStops(choice.route, choice.bound, choice.serviceType)

      setStops(result)

      if (result.length === 0) {
        setError('未有站點資料。')
      }
    } catch (err) {
      setStops([])
      setSelectedStop(null)
      setError(err instanceof Error ? err.message : '讀取站點失敗')
    } finally {
      setLoadingStops(false)
    }
  }

  const etaFetcher = useMemo(() => {
    if (!selectedRoute || !selectedStop) return null

    if (operator === 'kmb') {
      return () => getKmbEta(selectedStop.stopId, selectedRoute.route, selectedRoute.serviceType)
    }

    return () => getCitybusEta(selectedStop.stopId, selectedRoute.route)
  }, [operator, selectedRoute, selectedStop])

  const {
    data: etaRows,
    loading: etaLoading,
    error: etaError,
    updatedAt
  } = useEtaPolling(etaFetcher)

  return (
    <div className="app" data-theme={theme}>
      <a href="#main" className="skip-link">跳到主要內容</a>

      <aside className="sidebar">
        <Logo />

        <nav className="sidebar-nav" aria-label="主選單">
          <button className="nav-pill active">即時到站</button>
          <button className="nav-pill" disabled>收藏路線</button>
          <button className="nav-pill" disabled>設定</button>
        </nav>

        <div className="sidebar-footer">
          <p>純前端 MVP</p>
          <p>適合 GitHub Pages</p>
        </div>
      </aside>

      <header className="header">
        <div>
          <p className="eyebrow">Hong Kong bus arrival</p>
          <h1>巴士到站查詢</h1>
        </div>

        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </header>

      <main id="main" className="main">
        <section className="panel search-panel">
          <div className="panel-head">
            <h2>搜尋路線</h2>
            <p>輸入巴士號碼，再揀公司同方向。</p>
          </div>

          <div className="search-grid">
            <label>
              <span>巴士公司</span>
              <select
                value={operator}
                onChange={(e) => {
                  const nextOperator = e.target.value as Operator
                  setOperator(nextOperator)
                  setError('')
                  setRoute('')
                  resetResults()
                }}
              >
                <option value="kmb">KMB</option>
                <option value="ctb">Citybus</option>
              </select>
            </label>

            <label>
              <span>路線</span>
              <input
                value={route}
                onChange={(e) => setRoute(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loadingRoutes) {
                    void searchRoutes()
                  }
                }}
                placeholder="例如 930 / 22 / E11"
              />
            </label>

            <button
              className="primary-button"
              onClick={() => void searchRoutes()}
              disabled={!route.trim() || loadingRoutes}
            >
              {loadingRoutes ? '搜尋中…' : '搜尋'}
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="route-list">
            {!loadingRoutes && routes.length === 0 ? (
              <p className="muted">未搜尋或未找到路線。</p>
            ) : null}

            {routes.map((item, index) => (
              <button
                key={`${item.route}-${item.bound}-${item.serviceType}-${index}`}
                className={`route-card ${
                  selectedRoute?.route === item.route &&
                  selectedRoute?.bound === item.bound &&
                  selectedRoute?.serviceType === item.serviceType
                    ? 'selected'
                    : ''
                }`}
                onClick={() => void chooseRoute(item)}
                disabled={loadingStops}
              >
                <strong>{item.route}</strong>
                <span>{item.origin ?? '--'} → {item.destination}</span>
                <small>方向: {item.bound || '--'} · 特別班次: {item.serviceType}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="content-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>停靠站</h2>
              <p>{selectedRoute ? `已選路線 ${selectedRoute.route}` : '請先選一條路線'}</p>
            </div>

            {loadingStops ? <p className="muted">讀取站點中…</p> : null}

            <div className="stop-list">
              {!loadingStops && stops.length === 0 ? (
                <p className="muted">未有站點資料。</p>
              ) : null}

              {stops.map((stop) => (
                <button
                  key={stop.stopId}
                  className={`stop-item ${selectedStop?.stopId === stop.stopId ? 'selected' : ''}`}
                  onClick={() => {
                    setError('')
                    setSelectedStop(stop)
                  }}
                >
                  <span>{stop.sequence ? `${stop.sequence}. ` : ''}{stop.nameTc}</span>
                  <small>{stop.nameEn}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="panel eta-panel">
            <div className="panel-head">
              <h2>到站時間</h2>
              <p>{selectedStop ? selectedStop.nameTc : '請先選一個站'}</p>
            </div>

            {etaError ? <p className="error-text">{etaError}</p> : null}

            <div className="eta-meta">
              <span>{etaLoading ? '更新中…' : '已更新'}</span>
              <span>{updatedAt ? new Date(updatedAt).toLocaleTimeString('zh-HK') : '--'}</span>
            </div>

            <div className="eta-list">
              {!etaLoading && etaRows.length === 0 ? (
                <p className="muted">未有 ETA 資料。</p>
              ) : null}

              {etaRows.map((item, index) => (
                <article className="eta-card" key={`${item.destination}-${item.eta}-${index}`}>
                  <div>
                    <p className="eta-minutes">{minutesAway(item.eta)}</p>
                    <strong>{formatTime(item.eta)}</strong>
                  </div>

                  <div>
                    <p>{item.destination}</p>
                    <small>{item.remark || '正常班次'}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}
