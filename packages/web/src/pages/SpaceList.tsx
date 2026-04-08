import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, GitBranch, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchSpaces, fetchPresets, createSpace, deleteSpace } from '@/lib/api'
import type { SpaceMeta, PresetSummary } from '@/lib/types'

/* ─── Emoji 选择器 ─── */

const EMOJI_OPTIONS = ['🧠', '🚀', '💡', '🎯', '📚', '🔬', '🎨', '🏗️', '📝', '🌟', '⚡', '🔥', '🎮', '🎵', '🌍', '💼']

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-xl border border-border bg-surface flex items-center justify-center text-2xl hover:border-primary/50 transition-colors"
      >
        {value}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-card rounded-lg border border-border shadow-lg z-50 p-2 grid grid-cols-8 gap-1">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => { onChange(e); setOpen(false) }}
              className={cn('w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-surface transition-colors', value === e && 'bg-primary-light')}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── 颜色选择器 ─── */

const COLOR_OPTIONS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b']

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn('w-7 h-7 rounded-full border-2 transition-all', value === c ? 'border-text scale-110' : 'border-transparent hover:scale-105')}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

/* ─── PresetSession 编辑器 ─── */

interface PresetSessionDraft {
  name: string
  label: string
  systemPrompt: string
  guidePrompt: string
  activationHint: string
}

function PresetSessionEditor({
  sessions,
  onChange,
}: {
  sessions: PresetSessionDraft[]
  onChange: (s: PresetSessionDraft[]) => void
}) {
  const addSession = () => {
    onChange([...sessions, { name: '', label: '', systemPrompt: '', guidePrompt: '', activationHint: '' }])
  }
  const removeSession = (i: number) => {
    onChange(sessions.filter((_, idx) => idx !== i))
  }
  const updateSession = (i: number, field: keyof PresetSessionDraft, value: string) => {
    const updated = [...sessions]
    updated[i] = { ...updated[i]!, [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {sessions.map((s, i) => (
        <div key={i} className="bg-surface rounded-lg p-3 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted">预设节点 #{i + 1}</span>
            <button onClick={() => removeSession(i)} className="text-text-muted hover:text-error transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="标识 (name)"
              value={s.name} onChange={(e) => updateSession(i, 'name', e.target.value)}
              className="px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              placeholder="显示名称 (label)"
              value={s.label} onChange={(e) => updateSession(i, 'label', e.target.value)}
              className="px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <textarea
            placeholder="系统提示词 (systemPrompt)"
            value={s.systemPrompt} onChange={(e) => updateSession(i, 'systemPrompt', e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
          />
          <input
            placeholder="引导语 (guidePrompt) — 进入节点时的开场问题"
            value={s.guidePrompt} onChange={(e) => updateSession(i, 'guidePrompt', e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <input
            placeholder="激活条件 (activationHint) — AI 何时应激活此节点"
            value={s.activationHint} onChange={(e) => updateSession(i, 'activationHint', e.target.value)}
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      ))}
      <button
        onClick={addSession}
        className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
      >
        + 添加预设节点
      </button>
    </div>
  )
}

/* ─── Skill 编辑器 ─── */

interface SkillDraft {
  name: string
  description: string
  content: string
}

function SkillEditor({ skills, onChange }: { skills: SkillDraft[]; onChange: (s: SkillDraft[]) => void }) {
  const addSkill = () => {
    onChange([...skills, { name: '', description: '', content: '' }])
  }
  const removeSkill = (i: number) => {
    onChange(skills.filter((_, idx) => idx !== i))
  }
  const updateSkill = (i: number, field: keyof SkillDraft, value: string) => {
    const updated = [...skills]
    updated[i] = { ...updated[i]!, [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {skills.map((s, i) => (
        <div key={i} className="bg-surface rounded-lg p-3 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted">技能 #{i + 1}</span>
            <button onClick={() => removeSkill(i)} className="text-text-muted hover:text-error transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="技能名称 (name)"
              value={s.name} onChange={(e) => updateSkill(i, 'name', e.target.value)}
              className="px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              placeholder="描述 (description)"
              value={s.description} onChange={(e) => updateSkill(i, 'description', e.target.value)}
              className="px-2 py-1.5 rounded border border-border bg-card text-xs placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <textarea
            placeholder="激活时注入的完整 prompt (content)"
            value={s.content} onChange={(e) => updateSkill(i, 'content', e.target.value)}
            rows={3}
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs font-mono placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
          />
        </div>
      ))}
      <button
        onClick={addSkill}
        className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-text-muted hover:border-primary/40 hover:text-primary transition-colors"
      >
        + 添加技能
      </button>
    </div>
  )
}

/* ─── 创建 Kit 弹窗 ─── */

function CreateKitModal({
  presets,
  onClose,
  onCreated,
}: {
  presets: PresetSummary[]
  onClose: () => void
  onCreated: (meta: SpaceMeta) => void
}) {
  // 基础配置
  const [emoji, setEmoji] = useState('🧠')
  const [color, setColor] = useState('#6366f1')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [presetDirName, setPresetDirName] = useState(presets[0]?.dirName ?? '')
  const [mode, setMode] = useState<'AUTO' | 'PRO'>('AUTO')
  const [expectedArtifacts, setExpectedArtifacts] = useState('')

  // 高级配置
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedTab, setAdvancedTab] = useState<'sessions' | 'skills'>('sessions')
  const [presetSessions, setPresetSessions] = useState<PresetSessionDraft[]>([])
  const [skills, setSkills] = useState<SkillDraft[]>([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !presetDirName) return
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        presetDirName,
        emoji,
        color,
        mode,
      }
      if (description.trim()) body.description = description.trim()
      if (expectedArtifacts.trim()) body.expectedArtifacts = expectedArtifacts.trim()
      if (presetSessions.length > 0) {
        body.presetSessions = presetSessions
          .filter((s) => s.name && s.label)
          .map((s) => ({
            name: s.name, label: s.label,
            ...(s.systemPrompt && { systemPrompt: s.systemPrompt }),
            ...(s.guidePrompt && { guidePrompt: s.guidePrompt }),
            ...(s.activationHint && { activationHint: s.activationHint }),
          }))
      }
      if (skills.length > 0) {
        body.skills = skills
          .filter((s) => s.name && s.description && s.content)
          .map((s) => ({ name: s.name, description: s.description, content: s.content }))
      }
      const meta = await createSpace(body as Parameters<typeof createSpace>[0])
      onCreated(meta)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={cn(
          'bg-card rounded-xl shadow-2xl flex max-h-[85vh] transition-all duration-300',
          showAdvanced ? 'w-[860px]' : 'w-[460px]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左栏：基础配置 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-5">创建新空间</h2>

          <div className="space-y-4">
            {/* Emoji + 名称 */}
            <div className="flex gap-3 items-start">
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-text-muted mb-1">空间名称 *</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="如：黑客松项目规划"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  autoFocus
                />
              </div>
            </div>

            {/* 颜色 */}
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1.5">空间颜色</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {/* Preset */}
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">Preset 模板 *</label>
              <select
                value={presetDirName}
                onChange={(e) => setPresetDirName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {presets.map((p) => (
                  <option key={p.dirName} value={p.dirName}>{p.name} — {p.description}</option>
                ))}
              </select>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">主题描述</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="简要说明该空间的用途和目标"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* 预期产物 */}
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">预期产物</label>
              <textarea
                value={expectedArtifacts} onChange={(e) => setExpectedArtifacts(e.target.value)}
                placeholder="如：一份 PRD 和竞品分析报告"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* 模式 */}
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1.5">空间模式</label>
              <div className="flex gap-2">
                {(['AUTO', 'PRO'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all',
                      mode === m ? 'border-primary bg-primary-light text-primary shadow-sm' : 'border-border bg-surface text-text-secondary hover:bg-muted',
                    )}
                  >
                    {m}
                    <span className="block text-[10px] font-normal mt-0.5 text-text-muted">
                      {m === 'AUTO' ? 'AI 自动分裂，无感生长' : 'AI 判断后请求确认'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 高级配置展开按钮 */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors"
            >
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              高级配置
            </button>

            {error && <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-muted transition-colors">取消</button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || !presetDirName || loading}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              {loading ? '创建中...' : '创建空间'}
            </button>
          </div>
        </div>

        {/* 右栏：高级配置（可折叠） */}
        {showAdvanced && (
          <div className="w-[380px] border-l border-border p-5 overflow-y-auto bg-surface/50">
            <h3 className="text-sm font-semibold mb-3">高级配置</h3>

            {/* Tab 切换 */}
            <div className="flex border-b border-border mb-4">
              {([
                { key: 'sessions' as const, label: '预设节点' },
                { key: 'skills' as const, label: '技能' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAdvancedTab(tab.key)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium transition-colors',
                    advancedTab === tab.key
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-muted hover:text-text-secondary',
                  )}
                >
                  {tab.label}
                  {tab.key === 'sessions' && presetSessions.length > 0 && (
                    <span className="ml-1 text-[10px] bg-primary-light text-primary px-1.5 rounded-full">{presetSessions.length}</span>
                  )}
                  {tab.key === 'skills' && skills.length > 0 && (
                    <span className="ml-1 text-[10px] bg-primary-light text-primary px-1.5 rounded-full">{skills.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            {advancedTab === 'sessions' && (
              <div>
                <p className="text-[10px] text-text-muted mb-3">
                  预设节点在 Fork 模式中显示为待点亮的节点。每个节点注册为 ForkProfile，AI 可通过 stello_create_session 工具激活。
                </p>
                <PresetSessionEditor sessions={presetSessions} onChange={setPresetSessions} />
              </div>
            )}
            {advancedTab === 'skills' && (
              <div>
                <p className="text-[10px] text-text-muted mb-3">
                  技能是可被 AI 激活的 prompt 片段。AI 通过 activate_skill 工具按需加载。
                </p>
                <SkillEditor skills={skills} onChange={setSkills} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Kit Space 列表页 ─── */

export function SpaceList() {
  const navigate = useNavigate()
  const [spaces, setSpaces] = useState<SpaceMeta[]>([])
  const [presets, setPresets] = useState<PresetSummary[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetchSpaces().then(setSpaces).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    fetchPresets().then(setPresets)
  }, [refresh])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除「${name}」？`)) return
    await deleteSpace(id)
    refresh()
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Space</h1>
            <p className="text-text-muted text-sm mt-1">你的 AI 认知空间集合</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> 创建新空间
          </button>
        </div>

        {loading ? (
          <div className="text-center text-text-muted py-20">加载中...</div>
        ) : spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <GitBranch size={48} className="mb-4 opacity-30" />
            <p className="text-lg mb-2">还没有任何空间</p>
            <button onClick={() => setShowCreate(true)} className="text-primary hover:underline text-sm">
              创建你的第一个 Kit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spaces.map((s) => (
              <div key={s.id} onClick={() => navigate(`/kit/${s.id}`)}
                className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
                style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                      {s.emoji} {s.name}
                    </h3>
                    {s.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{s.description}</p>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2"
                    style={{ backgroundColor: s.color + '20', color: s.color }}
                  >
                    {s.mode}
                  </span>
                </div>
                {s.expectedArtifacts && (
                  <p className="text-[11px] text-text-muted mt-2 line-clamp-1">
                    📎 {s.expectedArtifacts}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                  <span>{new Date(s.createdAt).toLocaleDateString('zh-CN')}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.name) }}
                    className="ml-auto text-text-muted hover:text-error transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div onClick={() => setShowCreate(true)}
              className="border-2 border-dashed border-border rounded-xl p-5 flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary-light/30 transition-all min-h-[120px]"
            >
              <span className="text-text-muted flex items-center gap-2"><Plus size={18} /> 创建新空间</span>
            </div>
          </div>
        )}
      </div>

      {showCreate && presets.length > 0 && (
        <CreateKitModal
          presets={presets}
          onClose={() => setShowCreate(false)}
          onCreated={(meta) => navigate(`/kit/${meta.id}`)}
        />
      )}
    </div>
  )
}
