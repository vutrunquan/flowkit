import { Search, LayoutGrid, List, CheckSquare, Square, ArrowUpDown } from 'lucide-react'
import { Button } from '../ui/button'
import type { Scene } from '../../types'
import { type SceneStage, sceneStageStatus } from '../../lib/stageStats'

export type FilterStatus = 'ALL' | 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED'
export type ViewMode = 'grid' | 'compact'

interface Props {
  scenes: Scene[]
  stage: SceneStage
  orientation: string
  searchQuery: string
  onSearchChange: (q: string) => void
  statusFilter: FilterStatus
  onStatusFilterChange: (f: FilterStatus) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  sortFailedFirst: boolean
  onSortFailedFirstChange: (v: boolean) => void
  cardRatio: '16/9' | '9/16'
  onCardRatioChange: (r: '16/9' | '9/16') => void
  selectedCount: number
  totalVisibleCount: number
  onToggleSelectAll: () => void
}

export default function PipelineFilterBar({
  scenes,
  stage,
  orientation,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  sortFailedFirst,
  onSortFailedFirstChange,
  cardRatio,
  onCardRatioChange,
  selectedCount,
  totalVisibleCount,
  onToggleSelectAll,
}: Props) {
  // Counts by status
  const completed = scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'COMPLETED').length
  const processing = scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'PROCESSING').length
  const failed = scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'FAILED').length
  const pending = scenes.filter(s => sceneStageStatus(s, stage, orientation) === 'PENDING').length

  const allSelected = totalVisibleCount > 0 && selectedCount === totalVisibleCount

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Top Filter & Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo số cảnh (#12) hoặc từ khoá prompt..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* View & Aspect Ratio Toggles */}
        <div className="flex items-center gap-2">
          {/* Card Ratio Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => onCardRatioChange('16/9')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                cardRatio === '16/9' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tỷ lệ 16:9 Ngang"
            >
              16:9
            </button>
            <button
              onClick={() => onCardRatioChange('9/16')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                cardRatio === '9/16' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tỷ lệ 9:16 Dọc"
            >
              9:16
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chế độ xem lưới ảnh"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'compact' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chế độ xem thu gọn / danh sách"
            >
              <List size={14} />
            </button>
          </div>

          {/* Sort Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortFailedFirstChange(!sortFailedFirst)}
            className={`h-8 text-xs border-slate-200 bg-white gap-1.5 shadow-2xs ${
              sortFailedFirst ? 'text-blue-700 bg-blue-50 border-blue-300 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ArrowUpDown size={12} />
            {sortFailedFirst ? 'Chưa xong lên đầu' : 'Theo số thứ tự'}
          </Button>
        </div>
      </div>

      {/* Bottom Filter Pills & Selection Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả <span className="opacity-70 ml-1">({scenes.length})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('COMPLETED')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            Đã có ảnh <span className="opacity-70 ml-1">({completed})</span>
          </button>

          <button
            onClick={() => onStatusFilterChange('PENDING')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-orange-500 text-white shadow-2xs'
                : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100/70'
            }`}
          >
            Chưa tạo <span className="opacity-70 ml-1">({pending})</span>
          </button>

          {processing > 0 && (
            <button
              onClick={() => onStatusFilterChange('PROCESSING')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all animate-pulse ${
                statusFilter === 'PROCESSING'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              Đang tạo <span className="opacity-70 ml-1">({processing})</span>
            </button>
          )}

          {failed > 0 && (
            <button
              onClick={() => onStatusFilterChange('FAILED')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/70'
              }`}
            >
              Lỗi <span className="opacity-70 ml-1">({failed})</span>
            </button>
          )}
        </div>

        {/* Selection Checkbox */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSelectAll}
            className="h-7 text-xs text-slate-600 hover:text-slate-900 gap-1.5 px-2.5 font-medium"
          >
            {allSelected ? (
              <CheckSquare size={14} className="text-blue-600" />
            ) : (
              <Square size={14} />
            )}
            {allSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${totalVisibleCount})`}
          </Button>
        </div>
      </div>
    </div>
  )
}
