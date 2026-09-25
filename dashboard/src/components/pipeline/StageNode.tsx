import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '../ui/card'
import { Progress } from '../ui/progress'
import { useTranslation } from '../../i18n/useTranslation'

export type StageKey = 'refs' | 'image' | 'video' | 'upscale'

interface StageNodeProps {
  idx: string
  name: string
  subtitle: string
  done: number
  processing: number
  failed: number
  pending: number
  total: number
  isActive: boolean
  onClick: () => void
}

export default function StageNode({ idx, name, subtitle, done, processing, failed, pending, total, isActive, onClick }: StageNodeProps) {
  const { t } = useTranslation()
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <button onClick={onClick} className="flex-1 min-w-[200px] text-left transition-all">
      <Card
        className={`gap-3 py-3.5 h-full rounded-2xl bg-white border transition-all ${
          isActive
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/15'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
        }`}
      >
        {/* Top Active Bar */}
        <div
          className={`h-1 -mt-3.5 -mx-4 rounded-t-2xl transition-all ${
            isActive ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-blue-600' : 'bg-transparent'
          }`}
        />

        <CardHeader className="px-4 pb-1">
          <CardTitle>
            <span className="text-[11px] font-mono font-bold text-slate-400">{idx}</span>
            <span className="ml-2 text-sm font-bold tracking-tight text-slate-800 uppercase">{name}</span>
          </CardTitle>
          <CardDescription>
            <span className="text-xs text-slate-500">{subtitle}</span>
          </CardDescription>
          <CardAction>
            <span className="text-lg font-bold font-mono tracking-tight text-blue-600">{done}</span>
            <span className="text-xs text-slate-400 font-mono">/{total}</span>
          </CardAction>
        </CardHeader>

        <CardContent className="px-4">
          <Progress value={pct} className="h-1.5 bg-slate-100" />
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 mt-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">{done} {t('stageNode.done')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-700">{processing} {t('stageNode.proc')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-700">{failed} {t('stageNode.fail')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-slate-500">{pending} {t('stageNode.pend')}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
