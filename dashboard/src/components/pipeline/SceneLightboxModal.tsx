import { useEffect, useCallback, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Copy, Check, RotateCw, ExternalLink, Download } from 'lucide-react'
import type { Scene, StatusType } from '../../types'
import { type SceneStage, sceneStageStatus, getSceneImageUrl, getSceneVideoUrl } from '../../lib/stageStats'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface Props {
  open: boolean
  scene: Scene | null
  scenes: Scene[]
  stage: SceneStage
  orientation?: string
  onClose: () => void
  onSelectScene: (scene: Scene) => void
  onRetry: (scene: Scene) => void
  onOpenDetail?: (scene: Scene) => void
}

const STATUS_BADGE: Record<StatusType, { bg: string; text: string; border: string; dot: string }> = {
  COMPLETED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  PROCESSING: { bg: '#fefce8', text: '#b45309', border: '#fef08a', dot: '#f59e0b' },
  PENDING: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
  FAILED: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
}

export default function SceneLightboxModal({
  open,
  scene,
  scenes,
  stage,
  orientation = 'HORIZONTAL',
  onClose,
  onSelectScene,
  onRetry,
  onOpenDetail,
}: Props) {
  const [copied, setCopied] = useState(false)

  const currentIndex = scene ? scenes.findIndex(s => s.id === scene.id) : -1
  const prevScene = currentIndex > 0 ? scenes[currentIndex - 1] : null
  const nextScene = currentIndex >= 0 && currentIndex < scenes.length - 1 ? scenes[currentIndex + 1] : null

  const handlePrev = useCallback(() => {
    if (prevScene) onSelectScene(prevScene)
  }, [prevScene, onSelectScene])

  const handleNext = useCallback(() => {
    if (nextScene) onSelectScene(nextScene)
  }, [nextScene, onSelectScene])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, handlePrev, handleNext])

  if (!open || !scene) return null

  const imgUrl = getSceneImageUrl(scene, orientation)
  const vidUrl = getSceneVideoUrl(scene, orientation)
  const status = sceneStageStatus(scene, stage, orientation)
  const prompt = stage === 'video' ? scene.video_prompt : (scene.image_prompt || scene.prompt)
  const badgeStyle = STATUS_BADGE[status]

  const handleCopyPrompt = () => {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLandscape = orientation === 'HORIZONTAL'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Lightbox Card */}
      <div
        className="relative z-10 flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight text-slate-900">
              Cảnh {scene.display_order + 1}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({currentIndex + 1} / {scenes.length})
            </span>
            <Badge
              variant="outline"
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border shadow-2xs"
              style={{
                background: badgeStyle.bg,
                color: badgeStyle.text,
                borderColor: badgeStyle.border,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
                style={{ background: badgeStyle.dot }}
              />
              {status}
            </Badge>
            <Badge variant="outline" className="text-[11px] border-slate-200 text-slate-600 bg-white">
              {isLandscape ? '16:9 Ngang' : '9:16 Dọc'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDetail && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-slate-200 text-slate-700 hover:text-slate-900 bg-white"
                onClick={() => {
                  onClose()
                  onOpenDetail(scene)
                }}
              >
                Chi tiết <ExternalLink size={12} className="ml-1 text-slate-400" />
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Media Content Area */}
        <div className="relative flex-1 min-h-[300px] flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
          {/* Previous Button */}
          {prevScene && (
            <button
              onClick={handlePrev}
              className="absolute left-4 z-20 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 border border-white/20 backdrop-blur-sm transition-all hover:scale-105 shadow-lg"
              title="Cảnh trước (←)"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Next Button */}
          {nextScene && (
            <button
              onClick={handleNext}
              className="absolute right-4 z-20 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 border border-white/20 backdrop-blur-sm transition-all hover:scale-105 shadow-lg"
              title="Cảnh tiếp theo (→)"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Media View */}
          <div
            className="w-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              aspectRatio: isLandscape ? '16/9' : '9/16',
              maxHeight: '56vh',
              background: '#090910',
            }}
          >
            {stage === 'video' && vidUrl ? (
              <video src={vidUrl} controls autoPlay loop className="w-full h-full object-contain" />
            ) : imgUrl ? (
              <img
                src={imgUrl}
                alt={`Scene ${scene.display_order + 1}`}
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-white/50">
                <span className="text-sm">Chưa có ảnh/video cho cảnh này</span>
                <Button
                  size="sm"
                  onClick={() => onRetry(scene)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold gap-1.5 shadow-md"
                >
                  <RotateCw size={13} /> Tạo ảnh ngay
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Actions */}
        <div className="flex flex-col gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/60">
          {prompt && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 text-xs text-slate-700 leading-relaxed font-sans line-clamp-3 select-text bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block mb-1">
                  Prompt
                </span>
                {prompt}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="text-xs h-8 border-slate-200 text-slate-700 hover:text-slate-900 bg-white gap-1.5"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copied ? 'Đã sao chép' : 'Sao chép prompt'}
                </Button>

                <Button
                  size="sm"
                  onClick={() => onRetry(scene)}
                  className="text-xs h-8 bg-orange-500 hover:bg-orange-600 text-white font-medium gap-1.5 shadow-xs"
                >
                  <RotateCw size={13} />
                  Tạo lại cảnh này
                </Button>

                {imgUrl && (
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Download size={12} /> Mở ảnh gốc
                  </a>
                )}
              </div>
            </div>
          )}

          {scene.narrator_text && (
            <div className="text-xs text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200/80">
              <span className="font-bold mr-1.5">Lời thoại / Lời dẫn:</span>
              {scene.narrator_text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
