import { useState } from 'react'
import { X, Wand2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { fetchAPI } from '../../api/client'
import { parsePrompts, analyzeParsedPrompts } from '../../lib/promptParser'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  videoId: string
  orientation?: string
  onSuccess: () => void
}

export default function ImportPromptsModal({
  open,
  onClose,
  projectId,
  videoId,
  orientation = 'HORIZONTAL',
  onSuccess,
}: Props) {
  const [rawPrompts, setRawPrompts] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  if (!open) return null

  const parsedPrompts = parsePrompts(rawPrompts)
  const analyzedScenes = analyzeParsedPrompts(parsedPrompts)

  const handleClear = () => {
    setRawPrompts('')
  }

  const handleRemoveScene = (idxToRemove: number) => {
    const updated = parsedPrompts.filter((_, idx) => idx !== idxToRemove)
    setRawPrompts(updated.map((p, idx) => `${idx + 1}. ${p}`).join('\n\n'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedPrompts.length === 0) {
      setError('Vui lòng dán ít nhất một prompt')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Batch create scenes
      const createdScenes = await fetchAPI<any[]>('/api/scenes/batch', {
        method: 'POST',
        body: JSON.stringify({
          video_id: videoId,
          scenes: parsedPrompts.map(p => ({
            prompt: p,
          })),
        }),
      })

      // 2. Auto-start image generation if requested
      if (autoGenerate && createdScenes.length > 0) {
        const batchRequests = createdScenes.map(s => ({
          type: 'GENERATE_IMAGE',
          scene_id: s.id,
          project_id: projectId,
          video_id: videoId,
          orientation: orientation,
        }))

        await fetchAPI('/api/requests/batch', {
          method: 'POST',
          body: JSON.stringify({ requests: batchRequests }),
        }).catch(err => {
          console.warn('Could not auto-start batch requests:', err)
        })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Không thể nạp prompt vào video.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Wand2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Nạp Thêm Prompt Vào Video</h2>
              <p className="text-[11px] text-slate-500">Các cảnh mới sẽ tự động được nối tiếp vào cuối chuỗi video hiện tại</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Dán danh sách prompt (hỗ trợ đánh số thứ tự)
              </label>
              <button
                type="button"
                onClick={handleClear}
                disabled={!rawPrompts}
                className="text-[11px] text-slate-400 hover:text-slate-600 disabled:opacity-40"
              >
                Xóa trắng
              </button>
            </div>

            <textarea
              value={rawPrompts}
              onChange={e => setRawPrompts(e.target.value)}
              rows={7}
              placeholder={`1. Cảnh tiếp theo: nhân vật bước vào căn phòng thí nghiệm bí mật... \n2. Cảnh kế tiếp: cận cảnh chi tiết màn hình máy tính hiển thị mã nguồn...`}
              className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 transition-colors"
            />

            <div className="flex items-center justify-between mt-1.5 px-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[11px] py-0.5 ${
                    parsedPrompts.length > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  Đã nhận diện: {parsedPrompts.length} cảnh mới
                </Badge>
                {parsedPrompts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    {showPreview ? 'Ẩn xem trước' : 'Hiện xem trước'}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{rawPrompts.length} ký tự</span>
            </div>
          </div>

          {/* Preview list */}
          {showPreview && analyzedScenes.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Xem trước các cảnh sẽ nạp ({analyzedScenes.length}):
              </span>
              <div className="space-y-1.5">
                {analyzedScenes.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="font-mono font-bold text-orange-600 shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200">
                        +{item.index}
                      </span>
                      <p className="text-slate-700 line-clamp-2 leading-relaxed text-[11px] flex-1">
                        {item.prompt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">{item.wordCount} từ</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveScene(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50"
                        title="Xoá cảnh này"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-generate checkbox */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <input
              type="checkbox"
              id="importAutoGenerate"
              checked={autoGenerate}
              onChange={e => setAutoGenerate(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="importAutoGenerate" className="text-xs text-slate-700 cursor-pointer select-none">
              <span className="font-semibold text-emerald-800">Tự động bắt đầu tạo ảnh cho các cảnh mới này</span>
              <p className="text-[11px] text-slate-500">
                Ngay sau khi thêm vào video, hệ thống sẽ tự động đưa vào hàng đợi tạo ảnh.
              </p>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="h-8.5 px-3.5 text-xs border-slate-200"
          >
            Hủy
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || parsedPrompts.length === 0}
            className="h-8.5 px-4 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-xs gap-1.5"
          >
            {submitting ? (
              'Đang nạp...'
            ) : (
              <>
                <Plus size={14} />
                Nạp {parsedPrompts.length > 0 ? `${parsedPrompts.length} Cảnh` : 'Prompt'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
