import { useState, useEffect } from 'react'
import { X, Sparkles, Wand2, Film, Layers, Monitor, Smartphone, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { fetchAPI, patchAPI } from '../../api/client'
import { parsePrompts, analyzeParsedPrompts } from '../../lib/promptParser'
import type { Orientation } from '../../types'

interface MaterialItem {
  id: string
  name: string
  style_instruction: string
  scene_prefix?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (projectId: string) => void
}

const SAMPLE_PROMPTS = `1. Wide chalk scene: one figure mid-gesture at a kitchen table, mouth slightly open mid-word, a second figure listening. Composition: figure left, empty board-space right, held for the missing word. Style: hand-drawn white and light-gray chalk on a dark, dusty charcoal-black classroom chalkboard, muted cyan accent, visible chalk dust and erased smudges.

2. Add a faint dotted outline in the empty space to the right of the speaking figure's head — the shape of an object, drawn only in light chalk contour, no fill. Style: hand-drawn white and light-gray chalk on a dark, dusty charcoal-black classroom chalkboard.

3. The listener leans forward, eyes narrowed in focused contemplation, hand resting thoughtfully against chin while studying the glowing chalk outlines on the board. Style: hand-drawn white and light-gray chalk on a dark chalkboard.`

export default function NewProjectModal({ open, onClose, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rawPrompts, setRawPrompts] = useState('')
  const [imageModel, setImageModel] = useState<'NANO_BANANA_2' | 'NANO_BANANA_PRO' | 'NANO_BANANA_2_LITE'>('NANO_BANANA_2')
  const [orientation, setOrientation] = useState<Orientation>('HORIZONTAL')
  const [material, setMaterial] = useState('custom')
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Load materials & active models
  useEffect(() => {
    if (!open) return
    fetchAPI<MaterialItem[]>('/api/materials')
      .then(setMaterials)
      .catch(() => {})

    fetchAPI<any>('/api/models')
      .then(res => {
        if (res && res.default_image_model) {
          setImageModel(res.default_image_model)
        }
      })
      .catch(() => {})
  }, [open])

  if (!open) return null

  const parsedPrompts = parsePrompts(rawPrompts)
  const analyzedScenes = analyzeParsedPrompts(parsedPrompts)

  const handleLoadSample = () => {
    setName('Chalk Animation Story')
    setDescription('Câu chuyện hoạt họa phấn bảng tối giản với các đường nét nghệ thuật')
    setRawPrompts(SAMPLE_PROMPTS)
  }

  const handleClearPrompts = () => {
    setRawPrompts('')
  }

  const handleRemoveScene = (indexToRemove: number) => {
    const updated = parsedPrompts.filter((_, idx) => idx !== indexToRemove)
    setRawPrompts(updated.map((p, idx) => `${idx + 1}. ${p}`).join('\n\n'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Vui lòng nhập tên dự án')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Update image model if needed
      await patchAPI('/api/models', { default_image_model: imageModel }).catch(err => {
        console.warn('Could not update model config:', err)
      })

      // 2. Create project
      const createdProject = await fetchAPI<any>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          material: material,
        }),
      })

      if (!createdProject || !createdProject.id) {
        throw new Error('Không nhận được ID dự án từ máy chủ')
      }

      // 3. Create initial video with selected orientation
      const createdVideo = await fetchAPI<any>('/api/videos', {
        method: 'POST',
        body: JSON.stringify({
          project_id: createdProject.id,
          title: 'Video 1',
          orientation: orientation,
        }),
      })

      // 4. Batch import scenes if any prompts were parsed
      let createdScenes: any[] = []
      if (parsedPrompts.length > 0 && createdVideo && createdVideo.id) {
        createdScenes = await fetchAPI<any[]>('/api/scenes/batch', {
          method: 'POST',
          body: JSON.stringify({
            video_id: createdVideo.id,
            scenes: parsedPrompts.map((p, idx) => ({
              prompt: p,
              display_order: idx,
            })),
          }),
        })
      }

      // 5. Pin active project
      await fetchAPI('/api/active-project', {
        method: 'PUT',
        body: JSON.stringify({ project_id: createdProject.id }),
      }).catch(() => {})

      // 6. Auto-start image generation if requested and scenes exist
      if (autoGenerate && createdScenes.length > 0 && createdVideo && createdVideo.id) {
        const batchRequests = createdScenes.map(s => ({
          type: 'GENERATE_IMAGE',
          scene_id: s.id,
          project_id: createdProject.id,
          video_id: createdVideo.id,
          orientation: orientation,
        }))

        await fetchAPI('/api/requests/batch', {
          method: 'POST',
          body: JSON.stringify({ requests: batchRequests }),
        }).catch(err => {
          console.warn('Could not auto-start batch requests:', err)
        })
      }

      onSuccess(createdProject.id)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo dự án. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Tạo Dự Án Mới & Nạp Prompt</h2>
              <p className="text-xs text-slate-500">Thiết lập cấu hình model, tỷ lệ khung hình và danh sách prompt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Project Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Film size={14} className="text-orange-500" /> Thông Tin Dự Án
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên dự án <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ví dụ: Cuộc phiêu lưu không gian, Chalk Art..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả / Ngữ cảnh tóm tắt
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ghi chú về nội dung cốt truyện..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Model & Ratio Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers size={14} className="text-orange-500" /> Tuỳ Chọn Model & Khung Hình
            </h3>

            {/* Model Selector Cards */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Model tạo ảnh (Image Model)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setImageModel('NANO_BANANA_2')}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    imageModel === 'NANO_BANANA_2'
                      ? 'border-orange-500 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-900">Nano Banana 2</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 py-0">
                      Khuyên dùng
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">Imagen 3.2 — Nhanh, chuẩn xác và đồng nhất nhân vật</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageModel('NANO_BANANA_PRO')}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    imageModel === 'NANO_BANANA_PRO'
                      ? 'border-orange-500 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-900">Nano Banana Pro</span>
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 py-0">
                      Chất lượng cao
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">Imagen 3 Pro — Chi tiết vật thể và ánh sáng cao cấp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageModel('NANO_BANANA_2_LITE')}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    imageModel === 'NANO_BANANA_2_LITE'
                      ? 'border-orange-500 bg-orange-50/70 shadow-xs ring-1 ring-orange-400/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-900">Nano Banana Lite</span>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200 py-0">
                      Siêu nhanh
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">Harbor Seal — Tốc độ xử lý tối đa cho bản nháp</span>
                </button>
              </div>
            </div>

            {/* Ratio & Material Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Tỷ lệ khung hình (Aspect Ratio)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('HORIZONTAL')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      orientation === 'HORIZONTAL'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold ring-1 ring-orange-400/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Monitor size={15} className="text-orange-500" />
                    <span>16:9 Ngang (YouTube)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrientation('VERTICAL')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      orientation === 'VERTICAL'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 font-semibold ring-1 ring-orange-400/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone size={15} className="text-orange-500" />
                    <span>9:16 Dọc (Shorts/TikTok)</span>
                  </button>
                </div>
              </div>

              {/* Material/Style Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Chất liệu / Phong cách (Material Style)
                </label>
                <select
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                  {materials.length === 0 && (
                    <>
                      <option value="custom">Không áp dụng / Tự do (custom)</option>
                      <option value="realistic">Photorealistic (realistic)</option>
                      <option value="3d_pixar">3D Pixar</option>
                      <option value="anime">Anime</option>
                      <option value="ghibli">Studio Ghibli</option>
                      <option value="oil_painting">Oil Painting</option>
                    </>
                  )}
                </select>
                <p className="mt-1 text-[11px] text-slate-500 truncate">
                  {material === 'custom'
                    ? '✨ Giữ nguyên 100% nội dung prompt gốc của bạn, không tự ý chèn thêm tiền tố máy ảnh hay phong cách.'
                    : materials.find(m => m.id === material)?.style_instruction || 'Phong cách mỹ thuật áp dụng vào prompt'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Prompts Import & Parser */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Wand2 size={14} className="text-orange-500" /> Nạp Danh Sách Prompt
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-medium hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} /> Nạp mẫu thử
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearPrompts}
                  disabled={!rawPrompts}
                  className="text-[11px] text-slate-400 hover:text-slate-600 disabled:opacity-40"
                >
                  Xoá trắng
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={rawPrompts}
                onChange={e => setRawPrompts(e.target.value)}
                rows={6}
                placeholder={`Dán danh sách prompt tại đây...\nHỗ trợ đánh số thứ tự:\n1. Wide chalk scene: one figure mid-gesture...\n2. Add a faint dotted outline in the empty space...\nHoặc phân tách bằng 2 dòng trống liên tiếp.`}
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-500 transition-colors"
              />

              {/* Status pill inside textarea header */}
              <div className="flex items-center justify-between mt-1 px-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[11px] py-0.5 font-medium ${
                      parsedPrompts.length > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    Đã nhận diện: {parsedPrompts.length} cảnh
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
                <span className="text-[10px] text-slate-400">
                  {rawPrompts.length} ký tự
                </span>
              </div>
            </div>

            {/* Parsed Prompts Preview */}
            {showPreview && analyzedScenes.length > 0 && (
              <div className="space-y-2 mt-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Danh sách cảnh đã phân tách ({analyzedScenes.length}):
                </span>
                <div className="space-y-1.5">
                  {analyzedScenes.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 p-2 bg-white rounded-lg border border-slate-200/80 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="font-mono font-bold text-orange-600 shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200">
                          #{item.index}
                        </span>
                        <p className="text-slate-700 line-clamp-2 leading-relaxed text-[11px] flex-1">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.wordCount} từ
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveScene(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                          title="Xóa cảnh này"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Auto-start Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
            <input
              type="checkbox"
              id="autoGenerateCheck"
              checked={autoGenerate}
              onChange={e => setAutoGenerate(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="autoGenerateCheck" className="text-xs text-slate-700 cursor-pointer select-none">
              <span className="font-semibold text-emerald-800">Tự động bắt đầu tạo ảnh ngay sau khi tạo dự án</span>
              <p className="text-[11px] text-slate-500">
                Gửi toàn bộ các cảnh đã nạp vào hàng đợi tạo ảnh với model đã chọn ({imageModel}).
              </p>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <div className="text-xs text-slate-500">
            {parsedPrompts.length > 0 ? (
              <span>Sẽ tạo dự án với <strong>{parsedPrompts.length} cảnh</strong></span>
            ) : (
              <span>Có thể nạp prompt bổ sung sau bất cứ lúc nào</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-9 px-4 text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
              className="h-9 px-5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm gap-1.5 transition-all"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang khởi tạo dự án...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Tạo Dự Án & Bắt Đầu
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
