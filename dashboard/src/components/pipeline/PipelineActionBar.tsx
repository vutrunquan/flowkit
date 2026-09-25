import { useState } from 'react'
import { Play, Square, RefreshCw, CheckCircle2, AlertCircle, Clock, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import type { Scene, Video } from '../../types'
import { type SceneStage, sceneStageStatus } from '../../lib/stageStats'
import { fetchAPI } from '../../api/client'
import ImportPromptsModal from './ImportPromptsModal'

interface Props {
  projectId: string
  video: Video | null
  scenes: Scene[]
  stage: SceneStage
  pendingCount: number
  anyProcessing: boolean
  selectedSceneIds: Set<string>
  onClearSelection: () => void
  onRefresh: () => void
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export default function PipelineActionBar({
  projectId,
  video,
  scenes,
  stage,
  pendingCount,
  anyProcessing,
  selectedSceneIds,
  onClearSelection,
  onRefresh,
  onNotify,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const orientation = video?.orientation || 'HORIZONTAL'
  const isLandscape = orientation === 'HORIZONTAL'

  // Calculate current stage stats
  const completedCount = scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'COMPLETED').length
  const failedCount = scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'FAILED').length
  const processingCount = anyProcessing ? scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'PROCESSING').length || 1 : 0
  const missingCount = scenes.length - completedCount
  const pct = scenes.length > 0 ? Math.round((completedCount / scenes.length) * 100) : 0

  // 1-Click: Generate All Missing for current stage
  const handleGenerateAllMissing = async () => {
    if (!video || scenes.length === 0) return
    const missingScenes = scenes.filter(s => sceneStageStatus(s, stage, orientation) !== 'COMPLETED')
    if (missingScenes.length === 0) {
      onNotify?.('Tất cả các cảnh đã hoàn thành!', 'info')
      return
    }

    setSubmitting(true)
    try {
      const reqType = stage === 'video' ? 'GENERATE_VIDEO' : 'GENERATE_IMAGE'
      const batchItems = missingScenes.map(s => ({
        type: reqType,
        scene_id: s.id,
        project_id: projectId,
        video_id: video.id,
        orientation: video.orientation,
      }))

      await fetchAPI('/api/requests/batch', {
        method: 'POST',
        body: JSON.stringify({ requests: batchItems }),
      })
      onNotify?.(`Đã gửi ${missingScenes.length} cảnh vào hàng đợi tạo ${stage === 'video' ? 'video' : 'ảnh'}!`, 'success')
      onRefresh()
    } catch (e) {
      onNotify?.(`Lỗi: ${e instanceof Error ? e.message : 'Không thể gửi yêu cầu'}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 1-Click: Generate for Selected Scenes
  const handleGenerateSelected = async () => {
    if (!video || selectedSceneIds.size === 0) return
    const targetScenes = scenes.filter(s => selectedSceneIds.has(s.id))

    setSubmitting(true)
    try {
      const reqType = stage === 'video' ? 'REGENERATE_VIDEO' : 'REGENERATE_IMAGE'
      const batchItems = targetScenes.map(s => ({
        type: reqType,
        scene_id: s.id,
        project_id: projectId,
        video_id: video.id,
        orientation: video.orientation,
      }))

      await fetchAPI('/api/requests/batch', {
        method: 'POST',
        body: JSON.stringify({ requests: batchItems }),
      })
      onNotify?.(`Đã gửi ${targetScenes.length} cảnh được chọn vào hàng đợi!`, 'success')
      onClearSelection()
      onRefresh()
    } catch (e) {
      onNotify?.(`Lỗi: ${e instanceof Error ? e.message : 'Không thể gửi yêu cầu'}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // 1-Click: Stop / Cancel All Requests
  const handleStopAll = async () => {
    if (!video) return
    setStopping(true)
    try {
      const res = await fetchAPI<{ ok: boolean; cancelled: number }>('/api/requests/cancel', {
        method: 'POST',
        body: JSON.stringify({ video_id: video.id, project_id: projectId }),
      })
      onNotify?.(`Đã dừng tiến trình và huỷ ${res.cancelled || 0} yêu cầu đang chờ!`, 'success')
      onRefresh()
    } catch (e) {
      onNotify?.(`Lỗi: ${e instanceof Error ? e.message : 'Không thể dừng'}`, 'error')
    } finally {
      setStopping(false)
    }
  }

  // 1-Click: Refresh Media URLs
  const handleRefreshUrls = async () => {
    setRefreshing(true)
    try {
      await fetchAPI(`/api/flow/refresh-urls/${projectId}`, { method: 'POST' })
      onNotify?.('Đã làm mới tất cả đường dẫn ảnh/video thành công!', 'success')
      onRefresh()
    } catch (e) {
      onNotify?.(`Lỗi làm mới URL: ${e instanceof Error ? e.message : 'Thất bại'}`, 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const isQueueActive = pendingCount > 0 || anyProcessing

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Progress & Stats Info */}
        <div className="flex items-center gap-5 min-w-[280px]">
          <div className="flex flex-col gap-1.5 flex-1 max-w-[240px]">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">
                Tiến độ {stage === 'video' ? 'Video' : 'Ảnh'}:
              </span>
              <span className="font-mono text-blue-600 font-bold">{completedCount}/{scenes.length} ({pct}%)</span>
            </div>
            <Progress value={pct} className="h-2 bg-slate-100" />
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/80 gap-1 py-1 font-medium shadow-2xs">
              <CheckCircle2 size={12} className="text-emerald-500" /> {completedCount} Xong
            </Badge>
            {processingCount > 0 && (
              <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50/80 gap-1 py-1 font-medium animate-pulse shadow-2xs">
                <Clock size={12} className="text-amber-500" /> {processingCount} Đang chạy
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50/80 gap-1 py-1 font-medium shadow-2xs">
                {pendingCount} Chờ
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge variant="outline" className="border-rose-200 text-rose-700 bg-rose-50/80 gap-1 py-1 font-medium shadow-2xs">
                <AlertCircle size={12} className="text-rose-500" /> {failedCount} Lỗi
              </Badge>
            )}
            <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 py-1 text-[11px] font-mono">
              {isLandscape ? '16:9 Ngang' : '9:16 Dọc'}
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selected Scenes Action Pill */}
          {selectedSceneIds.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg shadow-2xs">
              <span className="text-xs text-orange-800 font-semibold px-1">
                Đã chọn {selectedSceneIds.size}
              </span>
              <Button
                size="sm"
                onClick={handleGenerateSelected}
                disabled={submitting}
                className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-xs gap-1"
              >
                <Sparkles size={12} /> Tạo lại đã chọn
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                className="h-7 text-xs text-slate-500 hover:text-slate-800 px-2"
              >
                Bỏ chọn
              </Button>
            </div>
          )}

          {/* Generate All Missing Button */}
          {missingCount > 0 && (
            <Button
              size="sm"
              onClick={handleGenerateAllMissing}
              disabled={submitting || isQueueActive}
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs shadow-sm gap-1.5 transition-all"
            >
              <Play size={13} fill="currentColor" />
              {submitting ? 'Đang gửi yêu cầu...' : `Tạo ${missingCount} ảnh còn thiếu`}
            </Button>
          )}

          {/* Stop / Cancel Queue Button */}
          {isQueueActive ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStopAll}
              disabled={stopping}
              className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm gap-1.5 animate-pulse"
            >
              <Square size={13} fill="currentColor" />
              {stopping ? 'Đang dừng...' : 'Dừng tạo ảnh ngay'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshUrls}
              disabled={refreshing}
              className="h-9 px-3.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs shadow-2xs gap-1.5 transition-all"
              title="Làm mới lại URL ảnh đã hết hạn"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              {refreshing ? 'Đang làm mới...' : 'Làm mới URL'}
            </Button>
          )}

          {/* Import More Prompts Button */}
          {video && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="h-9 px-3.5 bg-orange-50/70 border-orange-200 text-orange-800 hover:bg-orange-100 hover:text-orange-900 text-xs shadow-2xs gap-1.5 transition-all font-medium"
              title="Nạp thêm prompt vào video này"
            >
              <Wand2 size={13} className="text-orange-600" />
              Nạp Prompt
            </Button>
          )}
        </div>
      </div>

      {/* Import Prompts Modal */}
      {video && (
        <ImportPromptsModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          projectId={projectId}
          videoId={video.id}
          orientation={video.orientation || 'HORIZONTAL'}
          onSuccess={() => {
            onRefresh()
            onNotify?.('Đã nạp thêm cảnh mới vào video!', 'success')
          }}
        />
      )}
    </div>
  )
}
