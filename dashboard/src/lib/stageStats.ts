import type { Character, Request, Scene, StatusType } from '../types'

export type SceneStage = 'image' | 'video' | 'upscale'

export interface StageCount {
  done: number
  processing: number
  failed: number
  pending: number
  total: number
}

export function count(statuses: StatusType[]): StageCount {
  return {
    done: statuses.filter(s => s === 'COMPLETED').length,
    processing: statuses.filter(s => s === 'PROCESSING').length,
    failed: statuses.filter(s => s === 'FAILED').length,
    pending: statuses.filter(s => s === 'PENDING').length,
    total: statuses.length,
  }
}

export function sceneStageStatus(scene: Scene, stage: SceneStage, orientation?: string): StatusType {
  const isHoriz = orientation === 'HORIZONTAL' || (scene.horizontal_image_status === 'COMPLETED' && scene.vertical_image_status !== 'COMPLETED')
  if (stage === 'image') {
    if (orientation === 'HORIZONTAL') return scene.horizontal_image_status
    if (orientation === 'VERTICAL') return scene.vertical_image_status
    return isHoriz ? scene.horizontal_image_status : (scene.vertical_image_status !== 'PENDING' ? scene.vertical_image_status : scene.horizontal_image_status)
  }
  if (stage === 'video') {
    if (orientation === 'HORIZONTAL') return scene.horizontal_video_status
    if (orientation === 'VERTICAL') return scene.vertical_video_status
    return isHoriz ? scene.horizontal_video_status : (scene.vertical_video_status !== 'PENDING' ? scene.vertical_video_status : scene.horizontal_video_status)
  }
  if (orientation === 'HORIZONTAL') return scene.horizontal_upscale_status
  if (orientation === 'VERTICAL') return scene.vertical_upscale_status
  return isHoriz ? scene.horizontal_upscale_status : (scene.vertical_upscale_status !== 'PENDING' ? scene.vertical_upscale_status : scene.horizontal_upscale_status)
}

export function getSceneImageUrl(scene: Scene, orientation?: string): string | null {
  if (orientation === 'HORIZONTAL') return scene.horizontal_image_url || scene.vertical_image_url
  if (orientation === 'VERTICAL') return scene.vertical_image_url || scene.horizontal_image_url
  return scene.horizontal_image_url || scene.vertical_image_url
}

export function getSceneVideoUrl(scene: Scene, orientation?: string): string | null {
  if (orientation === 'HORIZONTAL') return scene.horizontal_video_url || scene.vertical_video_url
  if (orientation === 'VERTICAL') return scene.vertical_video_url || scene.horizontal_video_url
  return scene.horizontal_video_url || scene.vertical_video_url
}


export function charStatus(c: Character, requests: Request[]): StatusType {
  if (c.media_id) return 'COMPLETED'
  const reqs = requests.filter(r => r.character_id === c.id)
  if (reqs.some(r => r.status === 'PROCESSING')) return 'PROCESSING'
  if (reqs.some(r => r.status === 'FAILED')) return 'FAILED'
  return 'PENDING'
}

export const STAGE_TYPES: Record<SceneStage, string[]> = {
  image: ['GENERATE_IMAGE', 'REGENERATE_IMAGE', 'EDIT_IMAGE'],
  video: ['GENERATE_VIDEO', 'REGENERATE_VIDEO'],
  upscale: ['UPSCALE_VIDEO'],
}

export function latestRequest(requests: Request[], sceneId: string, stage: SceneStage): Request | undefined {
  return requests
    .filter(r => r.scene_id === sceneId && STAGE_TYPES[stage].includes(r.type))
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
}

/** Per-video stage completion %, used by Dashboard throughput and project stage-rollup cards. */
export function videoStageBreakdown(scenes: Scene[]): Record<SceneStage, StageCount> {
  return {
    image: count(scenes.map(s => sceneStageStatus(s, 'image'))),
    video: count(scenes.map(s => sceneStageStatus(s, 'video'))),
    upscale: count(scenes.map(s => sceneStageStatus(s, 'upscale'))),
  }
}
