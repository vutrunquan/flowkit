import { useState, useEffect } from 'react'
import { BrowserRouter, NavLink, Routes, Route, useLocation, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Film, ScrollText, BookOpen, SlidersHorizontal, Plus } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { WebSocketProvider } from './api/WebSocketContext'
import { useWebSocketContext } from './api/useWebSocketContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { useTranslation } from './i18n/useTranslation'
import { LANGS, LANG_LABELS, type Lang } from './i18n/translations'
import type { TranslationKey } from './i18n/translations'
import { fetchAPI } from './api/client'
import type { Project } from './types'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import LogsPage from './pages/LogsPage'
import GalleryPage from './pages/GalleryPage'
import GuidePage from './pages/GuidePage'
import SettingsPage from './pages/SettingsPage'
import NewProjectModal from './components/projects/NewProjectModal'

const NAV: { to: string; icon: typeof LayoutDashboard; labelKey: TranslationKey; exact: boolean }[] = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true },
  { to: '/projects', icon: FolderOpen, labelKey: 'nav.projects', exact: false },
  { to: '/gallery', icon: Film, labelKey: 'nav.gallery', exact: false },
  { to: '/logs', icon: ScrollText, labelKey: 'nav.logs', exact: false },
  { to: '/guide', icon: BookOpen, labelKey: 'nav.guide', exact: false },
  { to: '/settings', icon: SlidersHorizontal, labelKey: 'nav.settings', exact: false },
]

const BREADCRUMB_TAB_KEY: Record<string, TranslationKey> = {
  overview: 'app.breadcrumbTab.overview',
  characters: 'app.breadcrumbTab.characters',
  videos: 'app.breadcrumbTab.videos',
  pipeline: 'app.breadcrumbTab.pipeline',
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function useBreadcrumbs() {
  const { t } = useTranslation()
  const loc = useLocation()
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const [projectName, setProjectName] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchAPI<Project>(`/api/projects/${id}`).then(p => setProjectName(p.name)).catch(() => setProjectName(null))
  }, [id])

  const crumbs: string[] = []
  if (loc.pathname === '/') crumbs.push(t('app.breadcrumb.dashboard'))
  else if (loc.pathname.startsWith('/projects')) {
    crumbs.push(t('app.breadcrumb.projects'))
    if (id) {
      crumbs.push(projectName ?? '…')
      const tab = searchParams.get('tab')
      const tabKey = tab ? BREADCRUMB_TAB_KEY[tab] : undefined
      if (tabKey) crumbs.push(t(tabKey))
    }
  } else if (loc.pathname.startsWith('/gallery')) crumbs.push(t('app.breadcrumb.gallery'))
  else if (loc.pathname.startsWith('/logs')) crumbs.push(t('app.breadcrumb.logs'))
  else if (loc.pathname.startsWith('/guide')) crumbs.push(t('app.breadcrumb.guide'))
  else if (loc.pathname.startsWith('/settings')) crumbs.push(t('app.breadcrumb.settings'))

  return crumbs
}

function LanguageSwitcher() {
  const { lang, setLang } = useTranslation()
  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as Lang)}
      className="text-[10px] px-2 py-1 rounded outline-none w-full"
      style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
    >
      {LANGS.map(l => (
        <option key={l} value={l}>{LANG_LABELS[l]}</option>
      ))}
    </select>
  )
}

function Sidebar() {
  const { t } = useTranslation()
  const { worker } = useWebSocketContext()
  const [health, setHealth] = useState<{ extension_connected: boolean } | null>(null)

  useEffect(() => {
    fetchAPI<{ extension_connected: boolean }>('/health').then(setHealth).catch(() => setHealth(null))
  }, [])

  return (
    <aside className="w-52 flex-shrink-0 flex flex-col border-r bg-white border-slate-200">
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-slate-100">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black bg-gradient-to-br from-orange-500 via-rose-500 to-blue-600 text-white shadow-xs">F</span>
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-wider text-slate-800">{t('app.brandName')}</span>
          <span className="text-[10px] text-slate-400">{t('app.brandTag')}</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-3">
        {NAV.map(({ to, icon: Icon, labelKey, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all font-medium"
            style={({ isActive }) => ({
              background: isActive ? '#eff6ff' : 'transparent',
              color: isActive ? '#1d4ed8' : '#64748b',
              borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
              boxShadow: isActive ? '0 1px 2px 0 rgba(0, 0, 0, 0.03)' : 'none',
            })}
          >
            <Icon size={14} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 py-3.5 border-t border-slate-100 flex flex-col gap-2.5 bg-slate-50/50">
        <LanguageSwitcher />
        <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--muted)' }}>
          <span>{t('app.workers')}</span>
          <span className="font-semibold text-slate-700">{worker ? `${worker.active}/${worker.active + worker.slots}` : '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: health?.extension_connected ? '#10b981' : '#ef4444' }}
          />
          <span className={health?.extension_connected ? 'text-emerald-700' : 'text-rose-600'}>
            {health?.extension_connected ? t('app.extensionConnected') : health ? t('app.extensionDisconnected') : t('app.extensionChecking')}
          </span>
        </div>
      </div>
    </aside>
  )
}

function ActiveProjectPill() {
  const [activeProject, setActiveProject] = useState<{ project_id: string; project_name: string; orientation?: string } | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAPI<any>('/api/active-project')
      .then(res => {
        if (res && res.project_id) setActiveProject(res)
      })
      .catch(() => {})
  }, [])

  if (!activeProject) return null

  return (
    <button
      onClick={() => navigate(`/projects/${activeProject.project_id}?tab=pipeline`)}
      className="flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-orange-50/90 border border-orange-200/80 text-orange-800 hover:bg-orange-100 transition-all shadow-xs"
      title="Đi tới dự án đang hoạt động"
    >
      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      <span className="font-medium truncate max-w-[220px]">{activeProject.project_name}</span>
      <span className="text-[10px] font-mono font-semibold bg-orange-200/70 text-orange-900 px-1.5 py-0.5 rounded">
        {activeProject.orientation === 'HORIZONTAL' ? '16:9' : '9:16'}
      </span>
    </button>
  )
}

function Header() {
  const { t } = useTranslation()
  const { isConnected } = useWebSocketContext()
  const crumbs = useBreadcrumbs()
  const clock = useClock()
  const navigate = useNavigate()
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

  return (
    <header className="flex items-center justify-between gap-4 px-5 h-13 flex-shrink-0 border-b bg-white border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
        <span className="font-bold text-blue-600">{t('app.breadcrumbRoot')}</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-slate-300">/</span>
            <span className={i === crumbs.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-500'}>{c}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <ActiveProjectPill />
        <button
          onClick={() => setIsNewProjectOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
          title="Tạo dự án mới & nạp danh sách prompt"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Dự Án Mới</span>
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
        <span className="font-mono text-slate-500">{clock.toLocaleTimeString()}</span>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
          isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: isConnected ? '#10b981' : '#ef4444', animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none' }}
          />
          {isConnected ? t('app.wsLive') : t('app.wsDisconnected')}
        </span>
      </div>

      <NewProjectModal
        open={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSuccess={newId => {
          navigate(`/projects/${newId}?tab=pipeline`)
        }}
      />
    </header>
  )
}

function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-5">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <WebSocketProvider>
          <TooltipProvider>
            <Layout />
          </TooltipProvider>
        </WebSocketProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
