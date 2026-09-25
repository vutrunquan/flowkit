import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchAPI } from '../../api/client'
import { useWebSocketContext } from '../../api/useWebSocketContext'
import { useTranslation } from '../../i18n/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import { statusLabel, stateLabel } from '../../i18n/labels'
import type { Project, Video, Character, Scene, Request, SceneReview, StatusType } from '../../types'
import { count, sceneStageStatus, charStatus, latestRequest, type SceneStage } from '../../lib/stageStats'
import { Avatar, AvatarFallback, AvatarGroup } from '../ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import StageNode from './StageNode'
import SceneCard from './SceneCard'
import SceneCompactRow from './SceneCompactRow'
import SceneDetailSheet from './SceneDetailSheet'
import SceneLightboxModal from './SceneLightboxModal'
import PipelineActionBar from './PipelineActionBar'
import PipelineFilterBar, { type FilterStatus, type ViewMode } from './PipelineFilterBar'

type StageKey = 'refs' | 'image' | 'video' | 'upscale'

interface PipelineViewProps {
  projectId: string
  videoId: string
}

const STAGE_META: { key: StageKey; idx: string; nameKey: TranslationKey; subtitleKey: TranslationKey }[] = [
  { key: 'refs', idx: '01', nameKey: 'pipeline.railName.refs', subtitleKey: 'pipeline.railSubtitle.refs' },
  { key: 'image', idx: '02', nameKey: 'pipeline.railName.image', subtitleKey: 'pipeline.railSubtitle.image' },
  { key: 'video', idx: '03', nameKey: 'pipeline.railName.video', subtitleKey: 'pipeline.railSubtitle.video' },
  { key: 'upscale', idx: '04', nameKey: 'pipeline.railName.upscale', subtitleKey: 'pipeline.railSubtitle.upscale' },
]

export default function PipelineView({ projectId, videoId }: PipelineViewProps) {
  const { t } = useTranslation()
  const [project, setProject] = useState<Project | null>(null)
  const [video, setVideo] = useState<Video | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [requests, setRequests] = useState<Request[]>([])

  const [activeStage, setActiveStage] = useState<StageKey>('image')
  const [sortFailedFirst, setSortFailedFirst] = useState(false)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [reviews, setReviews] = useState<Record<string, SceneReview>>({})
  const [reviewRunning, setReviewRunning] = useState<{ sceneId: string; mode: 'light' | 'deep' } | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [retryingSceneId, setRetryingSceneId] = useState<string | null>(null)

  // New interactive controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [cardRatio, setCardRatio] = useState<'16/9' | '9/16'>('16/9')
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set())
  const [lightboxScene, setLightboxScene] = useState<Scene | null>(null)
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const { lastEvent } = useWebSocketContext()

  const load = useCallback(async () => {
    const [p, v, c, s, r] = await Promise.all([
      fetchAPI<Project>(`/api/projects/${projectId}`),
      fetchAPI<Video>(`/api/videos/${videoId}`),
      fetchAPI<Character[]>(`/api/projects/${projectId}/characters`),
      fetchAPI<Scene[]>(`/api/scenes?video_id=${videoId}`),
      fetchAPI<Request[]>(`/api/requests?project_id=${projectId}`),
    ])
    setProject(p)
    setVideo(v)
    setCharacters(c)
    setScenes(s)
    setRequests(r)
    if (v?.orientation === 'VERTICAL') {
      setCardRatio('9/16')
    } else {
      setCardRatio('16/9')
    }
  }, [projectId, videoId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'request_update' || lastEvent.type === 'urls_refreshed') {
      load()
    }
  }, [lastEvent, load])

  const orientation = video?.orientation || 'HORIZONTAL'
  const videoRequests = requests.filter(r => r.video_id === videoId)
  const anyProcessing = videoRequests.some(r => r.status === 'PROCESSING')
  const pendingCount = videoRequests.filter(r => r.status === 'PENDING').length

  const stageBreakdown: Record<StageKey, ReturnType<typeof count>> = {
    refs: count(characters.map(c => charStatus(c, requests))),
    image: count(scenes.map(s => sceneStageStatus(s, 'image', orientation))),
    video: count(scenes.map(s => sceneStageStatus(s, 'video', orientation))),
    upscale: count(scenes.map(s => sceneStageStatus(s, 'upscale', orientation))),
  }

  // Filter & Search Logic
  const filteredScenes = useMemo(() => {
    if (activeStage === 'refs') return scenes

    const currentStage = activeStage as SceneStage
    return scenes.filter(s => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        const sStatus = sceneStageStatus(s, currentStage, orientation)
        if (sStatus !== statusFilter) return false
      }

      // 2. Search Query (Number or text)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const orderMatch = (s.display_order + 1).toString() === q.replace('#', '')
        const promptText = (s.video_prompt || s.image_prompt || s.prompt || '').toLowerCase()
        const narratorText = (s.narrator_text || '').toLowerCase()
        if (!orderMatch && !promptText.includes(q) && !narratorText.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [scenes, activeStage, statusFilter, searchQuery, orientation])

  // Sorting
  const sortedScenes = useMemo(() => {
    let list = filteredScenes.slice()
    if (activeStage !== 'refs' && sortFailedFirst) {
      const rank: Record<StatusType, number> = { FAILED: 0, PROCESSING: 1, PENDING: 2, COMPLETED: 3 }
      list = list.sort((a, b) =>
        rank[sceneStageStatus(a, activeStage as SceneStage, orientation)] -
        rank[sceneStageStatus(b, activeStage as SceneStage, orientation)]
      )
    }
    return list
  }, [filteredScenes, activeStage, sortFailedFirst, orientation])

  const selectedScene = scenes.find(s => s.id === selectedSceneId) ?? null
  const sheetStage = activeStage === 'refs' ? 'image' : (activeStage as SceneStage)
  const sheetStageMeta = STAGE_META.find(m => m.key === activeStage)!

  function openSceneDetail(scene: Scene) {
    setSelectedSceneId(scene.id)
    setSheetOpen(true)
    setReviewError(null)
  }

  const handleToggleSelect = useCallback((sceneId: string) => {
    setSelectedSceneIds(prev => {
      const next = new Set(prev)
      if (next.has(sceneId)) next.delete(sceneId)
      else next.add(sceneId)
      return next
    })
  }, [])

  const handleToggleSelectAll = useCallback(() => {
    setSelectedSceneIds(prev => {
      if (prev.size === sortedScenes.length && sortedScenes.length > 0) {
        return new Set()
      }
      return new Set(sortedScenes.map(s => s.id))
    })
  }, [sortedScenes])

  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 4000)
  }, [])

  // Quick single retry from card or lightbox
  const handleQuickRetry = async (targetScene: Scene) => {
    setRetryingSceneId(targetScene.id)
    try {
      const reqType = activeStage === 'video' ? 'REGENERATE_VIDEO' : 'REGENERATE_IMAGE'
      await fetchAPI('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          type: reqType,
          scene_id: targetScene.id,
          project_id: projectId,
          video_id: videoId,
          orientation,
        }),
      })
      notify(`Đã gửi yêu cầu tạo lại cảnh ${targetScene.display_order + 1}!`, 'success')
      await load()
    } catch (e) {
      notify(`Lỗi: ${e instanceof Error ? e.message : 'Thất bại'}`, 'error')
    } finally {
      setRetryingSceneId(null)
    }
  }

  async function runReview(mode: 'light' | 'deep') {
    if (!selectedScene) return
    setReviewRunning({ sceneId: selectedScene.id, mode })
    setReviewError(null)
    try {
      const result = await fetchAPI<SceneReview>(
        `/api/videos/${videoId}/scenes/${selectedScene.id}/review?project_id=${projectId}&mode=${mode}`,
        { method: 'POST' }
      )
      setReviews(prev => ({ ...prev, [selectedScene.id]: result }))
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setReviewRunning(null)
    }
  }

  async function retryStage() {
    if (!selectedScene) return
    await handleQuickRetry(selectedScene)
  }

  return (
    <div className="flex flex-col gap-5 relative">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border animate-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/10'
              : 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-900/10'
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-6 pb-3 border-b border-slate-200">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <span className="font-bold text-blue-600">{t('app.breadcrumbRoot')}</span>
            <span>/</span>
            <span className="text-slate-500">{project?.name ?? '…'}</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">{video?.title ?? '…'}</span>
          </div>
          <div className="flex items-baseline gap-3.5">
            <h1 className="m-0 text-xl font-bold tracking-tight text-slate-900">{t('pipeline.heading')}</h1>
            <span className="text-xs text-slate-500">
              {t('pipeline.sceneCount', { n: scenes.length })} · {orientation === 'HORIZONTAL' ? '16:9 Ngang' : '9:16 Dọc'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {characters.length > 0 && (
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{t('pipeline.castEntities')}</span>
              <AvatarGroup>
                {characters.map(c => (
                  <Tooltip key={c.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="ring-2 ring-white">
                        <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col gap-1 max-w-[240px]">
                        <span className="text-xs font-semibold text-slate-900">{c.name} · {c.entity_type}</span>
                        {c.description && <span className="text-xs text-slate-600 leading-snug">{c.description}</span>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </div>
          )}
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: anyProcessing ? '#f59e0b' : '#94a3b8',
                animation: anyProcessing ? 'pulse 1.6s ease-in-out infinite' : 'none',
              }}
            />
            <span className="text-xs font-semibold" style={{ color: anyProcessing ? '#d97706' : '#64748b' }}>
              {stateLabel(t, anyProcessing ? 'RUNNING' : 'IDLE')}
            </span>
            <span className="text-xs text-slate-400">· {t('pipeline.queue', { n: pendingCount })}</span>
          </div>
        </div>
      </div>

      {/* Stage Rail */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
        {STAGE_META.map(m => (
          <StageNode
            key={m.key}
            idx={m.idx}
            name={t(m.nameKey)}
            subtitle={t(m.subtitleKey)}
            {...stageBreakdown[m.key]}
            isActive={activeStage === m.key}
            onClick={() => setActiveStage(m.key)}
          />
        ))}
      </div>

      {/* Action Command Bar for active scene stage */}
      {activeStage !== 'refs' && (
        <PipelineActionBar
          projectId={projectId}
          video={video}
          scenes={scenes}
          stage={activeStage as SceneStage}
          pendingCount={pendingCount}
          anyProcessing={anyProcessing}
          selectedSceneIds={selectedSceneIds}
          onClearSelection={() => setSelectedSceneIds(new Set())}
          onRefresh={load}
          onNotify={notify}
        />
      )}

      {/* Stage Content & Filter Area */}
      {activeStage === 'refs' ? (
        <div>
          <div className="text-xs mb-3 font-semibold uppercase tracking-wider text-slate-500">
            {t('pipeline.refsHeading', { n: characters.length })}
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {characters.map(c => {
              const st = charStatus(c, requests)
              return (
                <div key={c.id} className="flex flex-col gap-2.5 p-3 rounded-2xl text-xs bg-white border border-slate-200 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-full rounded-xl overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200" style={{ aspectRatio: '3/4', maxHeight: '160px' }}>
                    {c.reference_image_url ? (
                      <img src={c.reference_image_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 text-xs">{t('pipeline.noImage')}</span>
                    )}
                  </div>
                  <div className="font-semibold truncate text-slate-900">{c.name}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-medium">{c.entity_type}</div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st === 'COMPLETED' ? '#10b981' : st === 'PROCESSING' ? '#f59e0b' : st === 'FAILED' ? '#ef4444' : '#94a3b8' }} />
                    <span className="text-slate-600 font-medium">{statusLabel(t, st)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Smart Filter & Search Bar */}
          <PipelineFilterBar
            scenes={scenes}
            stage={activeStage as SceneStage}
            orientation={orientation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortFailedFirst={sortFailedFirst}
            onSortFailedFirstChange={setSortFailedFirst}
            cardRatio={cardRatio}
            onCardRatioChange={setCardRatio}
            selectedCount={selectedSceneIds.size}
            totalVisibleCount={sortedScenes.length}
            onToggleSelectAll={handleToggleSelectAll}
          />

          {/* Empty Search / Filter Feedback */}
          {sortedScenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-sm text-slate-600 mb-2">Không tìm thấy cảnh nào phù hợp với bộ lọc</span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('ALL')
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : viewMode === 'compact' ? (
            /* Compact / List View */
            <div className="flex flex-col gap-1.5">
              {sortedScenes.map(scene => {
                const stage = activeStage as SceneStage
                return (
                  <SceneCompactRow
                    key={scene.id}
                    scene={scene}
                    stage={stage}
                    orientation={orientation}
                    isSelected={selectedSceneIds.has(scene.id)}
                    onToggleSelect={handleToggleSelect}
                    onOpenLightbox={s => setLightboxScene(s)}
                    onOpenDetail={openSceneDetail}
                    onQuickRetry={handleQuickRetry}
                  />
                )
              })}
            </div>
          ) : (
            /* Grid View */
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns:
                  cardRatio === '16/9'
                    ? 'repeat(auto-fill, minmax(280px, 1fr))'
                    : 'repeat(auto-fill, minmax(210px, 1fr))',
              }}
            >
              {sortedScenes.map(scene => {
                const stage = activeStage as SceneStage
                const req = latestRequest(requests, scene.id, stage)
                return (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    stage={stage}
                    retries={req?.retry_count ?? 0}
                    verdict={stage === 'video' ? reviews[scene.id]?.verdict : undefined}
                    orientation={orientation}
                    cardRatio={cardRatio}
                    isSelected={selectedSceneIds.has(scene.id)}
                    onToggleSelect={handleToggleSelect}
                    onOpenLightbox={s => setLightboxScene(s)}
                    onQuickRetry={handleQuickRetry}
                    onClick={() => openSceneDetail(scene)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Lightbox / Fullscreen Viewer Modal */}
      <SceneLightboxModal
        open={!!lightboxScene}
        scene={lightboxScene}
        scenes={sortedScenes}
        stage={activeStage === 'refs' ? 'image' : (activeStage as SceneStage)}
        orientation={orientation}
        onClose={() => setLightboxScene(null)}
        onSelectScene={s => setLightboxScene(s)}
        onRetry={handleQuickRetry}
        onOpenDetail={openSceneDetail}
      />

      {/* Scene Detail Sheet */}
      <SceneDetailSheet
        key={selectedSceneId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        scene={selectedScene}
        stage={sheetStage}
        stageName={t(sheetStageMeta.nameKey)}
        characters={characters}
        requests={selectedScene ? requests.filter(r => r.scene_id === selectedScene.id) : []}
        review={selectedScene ? reviews[selectedScene.id] : undefined}
        reviewRunning={!!selectedScene && reviewRunning?.sceneId === selectedScene.id}
        runningMode={reviewRunning?.mode ?? null}
        reviewError={reviewError}
        onRunReview={runReview}
        onRetry={retryStage}
        retrying={!!selectedScene && retryingSceneId === selectedScene.id}
      />
    </div>
  )
}
