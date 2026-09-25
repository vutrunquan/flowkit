import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAPI } from '../api/client'
import type { Project } from '../types'
import ProjectDetailPage from './ProjectDetailPage'
import { useTranslation } from '../i18n/useTranslation'
import type { TranslationKey } from '../i18n/translations'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import NewProjectModal from '../components/projects/NewProjectModal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

type FilterTab = 'ACTIVE' | 'ARCHIVED' | 'ALL'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function TierBadge({ tier, t }: { tier: string | null; t: (key: TranslationKey) => string }) {
  if (!tier) return null
  const isTwo = tier.includes('TWO')
  return <Badge variant={isTwo ? 'default' : 'secondary'}>{isTwo ? t('projects.tier2') : t('projects.tier1')}</Badge>
}

function ProjectCard({
  project,
  onClick,
  onDelete,
  t,
}: {
  project: Project
  onClick: () => void
  onDelete: () => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}) {
  return (
    <Card className="py-4 gap-3 h-full cursor-pointer transition-all hover:shadow-md hover:border-slate-300 relative group" onClick={onClick}>
      <CardHeader>
        <CardTitle className="text-sm pr-6">{project.name}</CardTitle>
        {project.description && (
          <CardDescription className="text-[11px] leading-relaxed line-clamp-2">{project.description}</CardDescription>
        )}
        <CardAction>
          <TierBadge tier={project.user_paygate_tier} t={t} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {project.material && <Badge variant="outline">{project.material}</Badge>}
          <Badge variant="outline">{project.status}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-[10px] tracking-wide" style={{ color: 'var(--muted)' }}>
          {t('projects.footer', { date: formatDate(project.created_at), id: project.id.slice(0, 8) })}
        </span>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Xoá dự án này"
        >
          <Trash2 size={13} />
        </button>
      </CardFooter>
    </Card>
  )
}

export default function ProjectsPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>('ACTIVE')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadProjects = () => {
    setLoading(true)
    fetchAPI<Project[]>('/api/projects')
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    setDeleting(true)
    try {
      await fetchAPI(`/api/projects/${projectToDelete.id}`, { method: 'DELETE' })
      setProjectToDelete(null)
      loadProjects()
    } catch (err: any) {
      alert(err?.message || 'Không thể xoá dự án')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    setDeleting(true)
    try {
      await fetchAPI('/api/projects?all=true', { method: 'DELETE' })
      setIsDeleteAllOpen(false)
      loadProjects()
    } catch (err: any) {
      alert(err?.message || 'Không thể xoá tất cả dự án')
    } finally {
      setDeleting(false)
    }
  }

  // If there's an :id param, show detail page
  if (id) {
    return <ProjectDetailPage projectId={id} onBack={() => navigate('/projects')} />
  }

  const filtered = projects.filter(p => {
    if (tab === 'ALL') return p.status !== 'DELETED'
    return p.status === tab
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Tabs value={tab} onValueChange={v => setTab(v as FilterTab)}>
            <TabsList>
              <TabsTrigger value="ACTIVE">{t('projects.tab.active')}</TabsTrigger>
              <TabsTrigger value="ARCHIVED">{t('projects.tab.archived')}</TabsTrigger>
              <TabsTrigger value="ALL">{t('projects.tab.all')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{t('projects.count', { n: filtered.length })}</span>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDeleteAllOpen(true)}
              className="h-8.5 px-3 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shadow-xs gap-1.5"
            >
              <Trash2 size={13} />
              Xoá tất cả
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsNewProjectOpen(true)}
            className="h-8.5 px-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs shadow-xs gap-1.5 transition-all"
          >
            <Plus size={14} />
            Tạo dự án mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-xs" style={{ color: 'var(--muted)' }}>{t('projects.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
            <Sparkles size={24} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {projects.length === 0 ? 'Chưa có dự án nào' : t(`projects.empty.${tab}` as TranslationKey)}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Bắt đầu bằng cách tạo dự án mới, chọn model và nạp danh sách prompt theo cảnh để hệ thống tự động sinh ảnh!
          </p>
          <Button
            size="sm"
            onClick={() => setIsNewProjectOpen(true)}
            className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-xs gap-1.5"
          >
            <Plus size={14} /> Tạo dự án mới ngay
          </Button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`/projects/${p.id}`)}
              onDelete={() => setProjectToDelete(p)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        open={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSuccess={newId => {
          loadProjects()
          navigate(`/projects/${newId}?tab=pipeline`)
        }}
      />

      {/* Confirm Single Delete Modal */}
      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title="Xác nhận xoá dự án"
        description={`Bạn có chắc chắn muốn xoá dự án "${projectToDelete?.name}"? Toàn bộ video, cảnh và hình ảnh liên quan sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá vĩnh viễn"
        loading={deleting}
        onConfirm={handleDeleteProject}
        onClose={() => setProjectToDelete(null)}
      />

      {/* Confirm Delete All Modal */}
      <ConfirmDialog
        open={isDeleteAllOpen}
        title="Xác nhận xoá TOÀN BỘ dự án"
        description={`Bạn có chắc chắn muốn xoá tất cả ${projects.length} dự án trong hệ thống không? Toàn bộ video, cảnh và dữ liệu tạo sẽ bị xoá sạch.`}
        confirmLabel="Xoá tất cả dự án"
        loading={deleting}
        onConfirm={handleDeleteAll}
        onClose={() => setIsDeleteAllOpen(false)}
      />
    </div>
  )
}
