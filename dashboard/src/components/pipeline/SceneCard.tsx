import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '../ui/card'
import type { Scene, StatusType } from '../../types'
import { useTranslation } from '../../i18n/useTranslation'
import { statusLabel, stageTitleLabel } from '../../i18n/labels'
import { type SceneStage, sceneStageStatus, getSceneImageUrl } from '../../lib/stageStats'
import { ZoomIn, RotateCw, Copy, Check, CheckSquare, Square } from 'lucide-react'

interface SceneCardProps {
  scene: Scene
  stage: SceneStage
  retries: number
  verdict?: string
  orientation?: string
  cardRatio?: '16/9' | '9/16'
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  onOpenLightbox?: (scene: Scene) => void
  onQuickRetry?: (scene: Scene) => void
  onClick: () => void
}

const STATUS_BADGE: Record<StatusType, { bg: string; text: string; border: string; dot: string }> = {
  COMPLETED: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  PROCESSING: { bg: '#fefce8', text: '#b45309', border: '#fef08a', dot: '#f59e0b' },
  PENDING: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' },
  FAILED: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
}

export default function SceneCard({
  scene,
  stage,
  retries,
  verdict,
  orientation = 'HORIZONTAL',
  cardRatio = '16/9',
  isSelected = false,
  onToggleSelect,
  onOpenLightbox,
  onQuickRetry,
  onClick,
}: SceneCardProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const status = sceneStageStatus(scene, stage, orientation)
  const thumbUrl = getSceneImageUrl(scene, orientation)
  const prompt = stage === 'video' ? scene.video_prompt : (scene.image_prompt || scene.prompt)
  const badgeStyle = STATUS_BADGE[status]

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation()
    onQuickRetry?.(scene)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onOpenLightbox) {
      onOpenLightbox(scene)
    } else {
      onClick()
    }
  }

  return (
    <div
      className={`group relative text-left w-full rounded-2xl transition-all duration-200 select-none ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-md'
          : 'hover:shadow-md'
      }`}
    >
      <Card
        className={`gap-3 py-3.5 h-full cursor-pointer bg-white border border-slate-200 transition-all ${
          isSelected ? 'bg-blue-50/20 border-blue-400' : 'hover:border-slate-300'
        }`}
        onClick={onClick}
      >
        <CardHeader className="pb-1 px-4">
          <div className="flex items-center gap-2">
            {onToggleSelect && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onToggleSelect(scene.id)
                }}
                className="text-slate-400 hover:text-slate-700 transition-colors mr-0.5"
              >
                {isSelected ? (
                  <CheckSquare size={15} className="text-blue-600" />
                ) : (
                  <Square size={15} />
                )}
              </button>
            )}
            <CardTitle>
              <span className="text-sm font-semibold tracking-tight text-slate-800">
                {t('sceneCard.scene', { n: scene.display_order + 1 })}
              </span>
            </CardTitle>
          </div>

          <CardDescription>
            <span className="text-[11px] text-slate-400">
              {stageTitleLabel(t, stage)} · {scene.duration ? `${scene.duration}s` : t('sceneCard.still')}
            </span>
          </CardDescription>

          <CardAction>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs"
              style={{
                background: badgeStyle.bg,
                color: badgeStyle.text,
                borderColor: badgeStyle.border,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: badgeStyle.dot,
                  boxShadow: status === 'PROCESSING' ? `0 0 6px ${badgeStyle.dot}` : 'none',
                }}
              />
              {statusLabel(t, status)}
            </span>
          </CardAction>
        </CardHeader>

        <CardContent className="px-4">
          {/* Media Preview Container */}
          <div
            onClick={handleImageClick}
            className="group/img relative flex items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200 transition-all hover:border-slate-300"
            style={{
              aspectRatio: cardRatio,
            }}
          >
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={t('sceneCard.scene', { n: scene.display_order + 1 })}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-1 p-2 text-center">
                <span className="text-[11px] font-medium">
                  {status === 'PENDING'
                    ? t('sceneCard.notGenerated')
                    : status === 'FAILED'
                    ? t('sceneCard.noOutput')
                    : t('sceneCard.noPreview')}
                </span>
              </div>
            )}

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-all duration-200">
              <button
                type="button"
                onClick={handleImageClick}
                className="p-2 rounded-full bg-white text-slate-800 hover:bg-slate-100 transition-transform hover:scale-110 shadow-md"
                title="Phóng to ảnh (Lightbox)"
              >
                <ZoomIn size={15} />
              </button>

              <button
                type="button"
                onClick={handleRetry}
                className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-transform hover:scale-110 shadow-md"
                title="Tạo lại ảnh cảnh này"
              >
                <RotateCw size={15} />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-full bg-white text-slate-800 hover:bg-slate-100 transition-transform hover:scale-110 shadow-md"
                title="Sao chép prompt"
              >
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Prompt Snippet */}
          {prompt && (
            <p
              className="mt-2.5 text-xs leading-relaxed overflow-hidden text-slate-600 group-hover:text-slate-900 transition-colors font-sans"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {prompt}
            </p>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>{t('sceneCard.retries', { n: retries })}</span>
            {verdict && (
              <span className="font-semibold uppercase text-[10px] text-amber-600">
                {verdict}
              </span>
            )}
            <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
              Chi tiết →
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
