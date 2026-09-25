import { useState } from 'react'
import type { Scene } from '../../types'
import VideoPlayer from './VideoPlayer'
import { Badge } from '../ui/badge'
import { useTranslation } from '../../i18n/useTranslation'

type GalleryScene = Scene & { videoTitle?: string }

interface VideoGalleryProps {
  scenes: GalleryScene[]
}

export default function VideoGallery({ scenes }: VideoGalleryProps) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const videoscenes = scenes.filter(s => s.vertical_video_url || s.horizontal_video_url)

  if (videoscenes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        {t('gallery.empty')}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videoscenes.map((scene, idx) => {
          const isUpscaled = !!(scene.vertical_upscale_url || scene.horizontal_upscale_url)
          const thumb = scene.horizontal_image_url || scene.vertical_image_url
          const isHoriz = !!scene.horizontal_video_url
          return (
            <div
              key={scene.id}
              className="relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] bg-white border border-slate-200 shadow-2xs hover:shadow-md"
              onClick={() => setActiveIndex(idx)}
            >
              {/* Thumbnail */}
              <div className="relative bg-slate-100" style={{ aspectRatio: isHoriz ? '16/9' : '9/16' }}>
                {thumb ? (
                  <img
                    src={thumb}
                    alt={t('gallery.sceneAlt', { n: scene.display_order + 1 })}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    {t('gallery.noImage')}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-2.5 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40">
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/60 text-white font-mono">
                      #{scene.display_order + 1}
                    </span>
                    <Badge variant={isUpscaled ? 'default' : 'secondary'} className="text-[10px]">
                      {isUpscaled ? t('gallery.badgeUpscaled') : t('gallery.badgeVideo')}
                    </Badge>
                  </div>
                <div className="flex flex-col gap-0.5">
                  {scene.videoTitle && (
                    <span className="text-[10px] truncate text-slate-300">{scene.videoTitle}</span>
                  )}
                  <div className="text-xs truncate text-white">
                    {scene.prompt?.slice(0, 60) ?? ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>

      {activeIndex !== null && (
        <VideoPlayer
          scenes={videoscenes}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  )
}
