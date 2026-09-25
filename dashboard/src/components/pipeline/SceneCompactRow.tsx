import { useState } from 'react'
import { ZoomIn, RotateCw, Copy, Check, CheckSquare, Square, ChevronRight } from 'lucide-react'
import type { Scene, StatusType } from '../../types'
import { type SceneStage, sceneStageStatus, getSceneImageUrl } from '../../lib/stageStats'
import { Badge } from '../ui/badge'

interface Props {
  scene: Scene
  stage: SceneStage
  orientation?: string
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onOpenLightbox: (scene: Scene) => void
  onOpenDetail: (scene: Scene) => void
  onQuickRetry: (scene: Scene) => void
}

const STATUS_BADGE: Record<StatusType, { bg: string; text: string; border: string; dot: string }> = {
  COMPLETED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  PROCESSING: { bg: '#fefce8', text: '#b45309', border: '#fef08a', dot: '#f59e0b' },
  PENDING: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
  FAILED: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
}

export default function SceneCompactRow({
  scene,
  stage,
  orientation = 'HORIZONTAL',
  isSelected,
  onToggleSelect,
  onOpenLightbox,
  onOpenDetail,
  onQuickRetry,
}: Props) {
  const [copied, setCopied] = useState(false)
  const status = sceneStageStatus(scene, stage, orientation)
  const imgUrl = getSceneImageUrl(scene, orientation)
  const prompt = stage === 'video' ? scene.video_prompt : (scene.image_prompt || scene.prompt)
  const badgeStyle = STATUS_BADGE[status]

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      onClick={() => onOpenDetail(scene)}
      className={`group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-blue-50/70 border-blue-400 shadow-2xs'
          : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onToggleSelect(scene.id)
        }}
        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
      >
        {isSelected ? (
          <CheckSquare size={15} className="text-blue-600" />
        ) : (
          <Square size={15} />
        )}
      </button>

      {/* Scene Index */}
      <span className="text-xs font-mono font-bold text-slate-500 w-10 text-right">
        #{scene.display_order + 1}
      </span>

      {/* Mini Thumbnail */}
      <div
        onClick={e => {
          e.stopPropagation()
          onOpenLightbox(scene)
        }}
        className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 group-hover:border-slate-300 transition-all hover:scale-105 shadow-2xs"
      >
        {imgUrl ? (
          <img src={imgUrl} alt={`Scene ${scene.display_order + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
            —
          </div>
        )}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <ZoomIn size={13} className="text-white" />
        </div>
      </div>

      {/* Prompt Snippet */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-xs text-slate-700 truncate font-sans group-hover:text-slate-900 transition-colors">
          {prompt || '(Chưa có prompt)'}
        </p>
        {scene.narrator_text && (
          <span className="text-[11px] text-amber-700/80 truncate font-sans">
            🗣 {scene.narrator_text}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Badge
          variant="outline"
          className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border shadow-2xs"
          style={{
            background: badgeStyle.bg,
            color: badgeStyle.text,
            borderColor: badgeStyle.border,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: badgeStyle.dot }} />
          {status}
        </Badge>
      </div>

      {/* Quick Actions on Hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          title="Sao chép prompt"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        </button>

        <button
          onClick={e => {
            e.stopPropagation()
            onQuickRetry(scene)
          }}
          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 hover:text-orange-700 transition-colors"
          title="Tạo lại cảnh này"
        >
          <RotateCw size={13} />
        </button>

        <button
          onClick={e => {
            e.stopPropagation()
            onOpenLightbox(scene)
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          title="Phóng to ảnh"
        >
          <ZoomIn size={13} />
        </button>

        <ChevronRight size={15} className="text-slate-300 ml-0.5" />
      </div>
    </div>
  )
}
