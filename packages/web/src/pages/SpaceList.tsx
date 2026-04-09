import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, GitBranch, ChevronDown, ChevronRight, X, Store, Wrench, ArrowLeft, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchSpaces, fetchPresets, createSpace, deleteSpace } from '@/lib/api'
import type { SpaceMeta, PresetConfig } from '@/lib/types'

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
  systemPromptMode: 'preset' | 'prepend' | 'append'
  context: 'inherit' | 'none'
  consolidatePrompt: string
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
    onChange([...sessions, { name: '', label: '', systemPrompt: '', systemPromptMode: 'prepend', context: 'inherit', consolidatePrompt: '', guidePrompt: '', activationHint: '' }])
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
          {/* systemPromptMode + context */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-text-muted mb-1">提示词合成策略</label>
              <select
                value={s.systemPromptMode}
                onChange={(e) => updateSession(i, 'systemPromptMode', e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="prepend">prepend — 加在空间提示词前</option>
                <option value="append">append — 加在空间提示词后</option>
                <option value="preset">preset — 完全替换</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-text-muted mb-1">上下文继承</label>
              <select
                value={s.context}
                onChange={(e) => updateSession(i, 'context', e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="inherit">inherit — 继承父对话上下文</option>
                <option value="none">none — 空白上下文启动</option>
              </select>
            </div>
          </div>
          <textarea
            placeholder="节点专属 Consolidate Prompt（留空使用 space 级别）"
            value={s.consolidatePrompt} onChange={(e) => updateSession(i, 'consolidatePrompt', e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-xs font-mono placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
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

/* ─── Market 弹窗：浏览 preset 并一键创建（配置只读） ─── */

function MarketModal({
  presets,
  onClose,
  onCreated,
}: {
  presets: PresetConfig[]
  onClose: () => void
  onCreated: (meta: SpaceMeta) => void
}) {
  const [selected, setSelected] = useState<PresetConfig | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🧠')
  const [color, setColor] = useState('#6366f1')
  const [showDetail, setShowDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<'prompt' | 'sessions' | 'skills' | 'memory'>('prompt')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectPreset = (p: PresetConfig) => {
    setSelected(p)
    setEmoji(p.emoji)
    setColor(p.color)
    setName('')
    setShowDetail(false)
  }

  const handleCreate = async () => {
    if (!selected || !name.trim()) return
    setLoading(true)
    setError('')
    try {
      const meta = await createSpace({
        name: name.trim(),
        presetDirName: selected.dirName,
        emoji,
        color,
      })
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
        className="bg-card rounded-xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Store size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">Kit Market</h2>
          </div>
          <p className="text-xs text-text-muted">选择一个预置模板，快速创建认知空间</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Preset 网格 */}
          {!selected ? (
            <div className="grid grid-cols-2 gap-3">
              {presets.map((p) => (
                <button
                  key={p.dirName}
                  onClick={() => selectPreset(p)}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-surface hover:border-primary/40 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{p.name}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ backgroundColor: p.color + '20', color: p.color }}
                    >
                      {p.mode}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted line-clamp-2">{p.description}</p>
                  <div className="flex gap-2 mt-1">
                    {p.forkProfiles.length > 0 && (
                      <span className="text-[10px] bg-muted text-text-muted px-1.5 py-0.5 rounded">
                        {p.forkProfiles.length} 预设节点
                      </span>
                    )}
                    {p.skills.length > 0 && (
                      <span className="text-[10px] bg-muted text-text-muted px-1.5 py-0.5 rounded">
                        {p.skills.length} 技能
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* 已选 preset — 配置预览 + 命名 */
            <div className="space-y-5">
              {/* 返回按钮 */}
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
              >
                <ArrowLeft size={14} /> 返回列表
              </button>

              {/* Preset 信息卡 */}
              <div className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{selected.emoji}</span>
                  <div>
                    <h3 className="text-base font-semibold">{selected.name}</h3>
                    <p className="text-xs text-text-muted">{selected.description}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto shrink-0"
                    style={{ backgroundColor: selected.color + '20', color: selected.color }}
                  >
                    {selected.mode}
                  </span>
                </div>

                {/* 只读预览 toggle */}
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="flex items-center gap-1 text-[11px] text-text-muted hover:text-primary transition-colors"
                >
                  <Eye size={12} />
                  {showDetail ? '收起配置详情' : '查看配置详情'}
                  {showDetail ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {showDetail && (
                  <div className="mt-3">
                    {/* Tab 栏 */}
                    <div className="flex border-b border-border mb-3">
                      {([
                        { key: 'prompt' as const, label: '系统提示词' },
                        { key: 'sessions' as const, label: '预设节点', count: selected.forkProfiles.length },
                        { key: 'skills' as const, label: '技能', count: selected.skills.length },
                        { key: 'memory' as const, label: '记忆提炼' },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setDetailTab(tab.key)}
                          className={cn(
                            'px-3 py-2 text-[11px] font-medium transition-colors',
                            detailTab === tab.key
                              ? 'text-primary border-b-2 border-primary'
                              : 'text-text-muted hover:text-text-secondary',
                          )}
                        >
                          {tab.label}
                          {'count' in tab && (tab as { count?: number }).count! > 0 && (
                            <span className="ml-1 text-[10px] bg-primary-light text-primary px-1.5 rounded-full">{(tab as { count?: number }).count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* 系统提示词 */}
                    {detailTab === 'prompt' && (
                      <div className="space-y-3">
                        <div className="px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-text-secondary whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {selected.systemPrompt || '(使用默认)'}
                        </div>
                        {selected.expectedArtifacts && (
                          <div>
                            <label className="block text-[10px] font-medium text-text-muted mb-1">预期产物</label>
                            <div className="px-3 py-2 rounded-lg bg-card border border-border text-xs text-text-secondary">
                              {selected.expectedArtifacts}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 预设节点 */}
                    {detailTab === 'sessions' && (
                      <div className="space-y-2">
                        {selected.forkProfiles.length === 0 ? (
                          <p className="text-[11px] text-text-muted">无预设节点</p>
                        ) : (
                          selected.forkProfiles.map((fp, i) => (
                            <div key={i} className="px-3 py-2.5 rounded-lg bg-card border border-border space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{fp.name}</span>
                                <div className="flex gap-1 ml-auto">
                                  {fp.systemPromptMode && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-text-muted">{fp.systemPromptMode}</span>
                                  )}
                                  {fp.context && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-text-muted">{fp.context}</span>
                                  )}
                                </div>
                              </div>
                              {fp.systemPrompt && (
                                <div>
                                  <label className="block text-[9px] text-text-muted mb-0.5">系统提示词</label>
                                  <div className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                                    {fp.systemPrompt}
                                  </div>
                                </div>
                              )}
                              {fp.consolidatePrompt && (
                                <div>
                                  <label className="block text-[9px] text-text-muted mb-0.5">Consolidate 提示词</label>
                                  <div className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">
                                    {fp.consolidatePrompt}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* 技能 */}
                    {detailTab === 'skills' && (
                      <div className="space-y-1.5">
                        {selected.skills.length === 0 ? (
                          <p className="text-[11px] text-text-muted">无技能</p>
                        ) : (
                          selected.skills.map((sk, i) => (
                            <div key={i} className="px-3 py-2 rounded-lg bg-card border border-border">
                              <div className="text-xs font-medium">{sk.name}</div>
                              <div className="text-[10px] text-text-muted">{sk.description}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* 记忆提炼 */}
                    {detailTab === 'memory' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-medium text-text-muted mb-1">
                            Consolidate Prompt
                            <span className="ml-1 text-[10px] font-normal">（L3 对话 → L2 摘要）</span>
                          </label>
                          <div className="px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {selected.consolidatePrompt || '(使用 SDK 默认)'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-text-muted mb-1">
                            Integrate Prompt
                            <span className="ml-1 text-[10px] font-normal">（所有 L2 → synthesis + insights）</span>
                          </label>
                          <div className="px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {selected.integratePrompt || '(使用 SDK 默认)'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 用户可编辑部分：名称、emoji、颜色 */}
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <EmojiPicker value={emoji} onChange={setEmoji} />
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-text-muted mb-1">空间名称 *</label>
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="给你的空间起个名字"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1.5">空间颜色</label>
                  <ColorPicker value={color} onChange={setColor} />
                </div>
              </div>

              {error && <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-muted transition-colors">取消</button>
          {selected && (
            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              {loading ? '创建中...' : '使用此模板创建'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── 自定义创建弹窗：所有字段可编辑 ─── */

function CustomCreateModal({
  presets,
  onClose,
  onCreated,
}: {
  presets: PresetConfig[]
  onClose: () => void
  onCreated: (meta: SpaceMeta) => void
}) {
  const [emoji, setEmoji] = useState('🧠')
  const [color, setColor] = useState('#6366f1')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<'AUTO' | 'PRO'>('AUTO')
  const [expectedArtifacts, setExpectedArtifacts] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')

  const [consolidatePrompt, setConsolidatePrompt] = useState('')
  const [integratePrompt, setIntegratePrompt] = useState('')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedTab, setAdvancedTab] = useState<'sessions' | 'skills' | 'prompts'>('sessions')
  const [presetSessions, setPresetSessions] = useState<PresetSessionDraft[]>([])
  const [skills, setSkills] = useState<SkillDraft[]>([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 使用第一个 preset 作为 base（后端需要 presetDirName）
  const baseDirName = presets[0]?.dirName ?? ''

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const body: Parameters<typeof createSpace>[0] = {
        name: name.trim(),
        presetDirName: baseDirName,
        emoji,
        color,
        mode,
      }
      if (description.trim()) body.description = description.trim()
      if (expectedArtifacts.trim()) body.expectedArtifacts = expectedArtifacts.trim()
      if (systemPrompt.trim()) body.systemPrompt = systemPrompt.trim()
      if (consolidatePrompt.trim()) body.consolidatePrompt = consolidatePrompt.trim()
      if (integratePrompt.trim()) body.integratePrompt = integratePrompt.trim()
      const validSessions = presetSessions.filter((s) => s.name && s.label)
      if (validSessions.length > 0) {
        body.presetSessions = validSessions.map((s) => ({
          name: s.name, label: s.label,
          systemPromptMode: s.systemPromptMode,
          context: s.context,
          ...(s.systemPrompt && { systemPrompt: s.systemPrompt }),
          ...(s.consolidatePrompt && { consolidatePrompt: s.consolidatePrompt }),
          ...(s.guidePrompt && { guidePrompt: s.guidePrompt }),
          ...(s.activationHint && { activationHint: s.activationHint }),
        }))
      }
      const validSkills = skills.filter((s) => s.name && s.description && s.content)
      if (validSkills.length > 0) {
        body.skills = validSkills
      }
      const meta = await createSpace(body)
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
          showAdvanced ? 'w-[900px]' : 'w-[480px]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左栏：基础配置 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-5">
            <Wrench size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">自定义创建</h2>
          </div>

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

            {/* 系统提示词 */}
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">系统提示词</label>
              <textarea
                value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="定义 AI 助手的角色、工作方式和回答风格"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-xs font-mono placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <p className="text-[10px] text-text-muted mt-0.5">工具使用规则由框架自动注入，无需手动编写</p>
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
              高级配置（预设节点 & 技能 & 记忆提炼）
              {(presetSessions.length > 0 || skills.length > 0 || consolidatePrompt || integratePrompt) && (
                <span className="text-[10px] bg-primary-light text-primary px-1.5 rounded-full">
                  {presetSessions.length + skills.length + (consolidatePrompt ? 1 : 0) + (integratePrompt ? 1 : 0)}
                </span>
              )}
            </button>

            {error && <p className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{error}</p>}
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-muted transition-colors">取消</button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              {loading ? '创建中...' : '创建空间'}
            </button>
          </div>
        </div>

        {/* 右栏：高级配置（可折叠） */}
        {showAdvanced && (
          <div className="w-[400px] border-l border-border p-5 overflow-y-auto bg-surface/50">
            <h3 className="text-sm font-semibold mb-3">高级配置</h3>

            <div className="flex border-b border-border mb-4">
              {([
                { key: 'sessions' as const, label: '预设节点' },
                { key: 'skills' as const, label: '技能' },
                { key: 'prompts' as const, label: '记忆提炼' },
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
                  {tab.key === 'prompts' && (consolidatePrompt || integratePrompt) && (
                    <span className="ml-1 text-[10px] bg-primary-light text-primary px-1.5 rounded-full">✓</span>
                  )}
                </button>
              ))}
            </div>

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
            {advancedTab === 'prompts' && (
              <div className="space-y-4">
                <p className="text-[10px] text-text-muted">
                  自定义 L3→L2 提炼和跨 Session 集成的提示词。留空则使用 SDK 默认提示词。
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Consolidate Prompt
                    <span className="ml-1 text-[10px] font-normal">（L3 对话 → L2 摘要）</span>
                  </label>
                  <textarea
                    value={consolidatePrompt}
                    onChange={(e) => setConsolidatePrompt(e.target.value)}
                    placeholder={'留空使用默认：\n将以下对话记录提炼为一段简洁的摘要...'}
                    rows={5}
                    className="w-full px-2 py-2 rounded border border-border bg-card text-xs font-mono placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-muted mb-1">
                    Integrate Prompt
                    <span className="ml-1 text-[10px] font-normal">（所有 L2 → synthesis + insights）</span>
                  </label>
                  <textarea
                    value={integratePrompt}
                    onChange={(e) => setIntegratePrompt(e.target.value)}
                    placeholder={'留空使用默认：\n基于以下各子 Session 的摘要，生成综合认知和定向洞察...'}
                    rows={5}
                    className="w-full px-2 py-2 rounded border border-border bg-card text-xs font-mono placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                </div>
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
  const [presets, setPresets] = useState<PresetConfig[]>([])
  const [showMarket, setShowMarket] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
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
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMarket(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              <Store size={16} /> Kit Market
            </button>
            <button onClick={() => setShowCustom(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-text-secondary hover:bg-muted transition-colors"
            >
              <Wrench size={16} /> 自定义创建
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-text-muted py-20">加载中...</div>
        ) : spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <GitBranch size={48} className="mb-4 opacity-30" />
            <p className="text-lg mb-2">还没有任何空间</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowMarket(true)} className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                <Store size={14} /> 从 Market 选择
              </button>
              <span className="text-text-muted">或</span>
              <button onClick={() => setShowCustom(true)} className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                <Wrench size={14} /> 自定义创建
              </button>
            </div>
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
          </div>
        )}
      </div>

      {showMarket && presets.length > 0 && (
        <MarketModal
          presets={presets}
          onClose={() => setShowMarket(false)}
          onCreated={(meta) => navigate(`/kit/${meta.id}`)}
        />
      )}

      {showCustom && presets.length > 0 && (
        <CustomCreateModal
          presets={presets}
          onClose={() => setShowCustom(false)}
          onCreated={(meta) => navigate(`/kit/${meta.id}`)}
        />
      )}
    </div>
  )
}
