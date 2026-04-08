import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { updateSpace, type Space, type SpaceMode } from '../lib/api'

interface SettingsPanelProps {
  space: Space
  onClose: () => void
  onUpdate: (space: Space) => void
}

const EMOJI_OPTIONS = ['💡', '🧠', '⚙️', '📊', '🎯', '🚀', '📝', '🎨', '🔬', '🌟', '📦', '🛠️']
const COLOR_OPTIONS = ['#3a6bc5', '#c94a4a', '#5ba85b', '#c78a30', '#7E57C2', '#e91e8c']

export function SettingsPanel({ space, onClose, onUpdate }: SettingsPanelProps) {
  const [label, setLabel] = useState(space.label)
  const [emoji, setEmoji] = useState(space.emoji)
  const [color, setColor] = useState(space.color)
  const [desc, setDesc] = useState(space.description)
  const [mode, setMode] = useState<SpaceMode>(space.mode)
  const [deliverables, setDeliverables] = useState(space.deliverables.join(', '))
  const [systemPrompt, setSystemPrompt] = useState(space.systemPrompt)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLabel(space.label)
    setEmoji(space.emoji)
    setColor(space.color)
    setDesc(space.description)
    setMode(space.mode)
    setDeliverables(space.deliverables.join(', '))
    setSystemPrompt(space.systemPrompt)
  }, [space])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { space: updated } = await updateSpace(space.id, {
        label: label.trim(),
        emoji,
        color,
        description: desc.trim(),
        mode,
        deliverables: deliverables.split(/[,，\s]+/).filter(Boolean),
        systemPrompt,
      })
      onUpdate(updated)
      onClose()
    } catch {
      alert('保存失败')
    }
    setSaving(false)
  }

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handAlt = { fontFamily: 'var(--font-hand-alt)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} style={{ background: 'rgba(42,42,42,0.2)' }} />
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-[101] overflow-y-auto"
        style={{
          background: 'var(--color-paper)',
          borderLeft: '1.5px solid var(--color-ink)',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
          animation: 'drawerSlideIn 0.25s ease-out',
        }}
      >
        <div className="p-7">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[24px] font-bold" style={{ ...handFont, color: 'var(--color-ink)' }}>
              空间设置
            </h2>
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer p-1"
              style={{ color: 'var(--color-pencil)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 基础信息 */}
          <section className="mb-6">
            <h3
              className="text-[17px] font-semibold mb-4 pb-2"
              style={{ ...handFont, color: 'var(--color-blue-pen)', borderBottom: '1px solid rgba(42,42,42,0.08)' }}
            >
              基础信息
            </h3>

            {/* Emoji + 颜色 */}
            <div className="flex gap-5 mb-4">
              <div>
                <label className="block mb-1.5" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>图标</label>
                <div className="flex flex-wrap gap-1 max-w-[160px]">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-7 h-7 flex items-center justify-center rounded cursor-pointer border-none text-[16px] hover:scale-110 transition-transform"
                      style={{
                        background: emoji === e ? 'rgba(58,107,197,0.12)' : 'transparent',
                        outline: emoji === e ? '2px solid var(--color-blue-pen)' : 'none',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1.5" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>颜色</label>
                <div className="flex gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full cursor-pointer border-none hover:scale-110 transition-transform"
                      style={{
                        background: c,
                        outline: color === c ? '2.5px solid var(--color-ink)' : '1px solid rgba(42,42,42,0.12)',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 名称 */}
            <label className="block mb-1" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>名称</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border-none outline-none bg-transparent mb-4"
              style={{ borderBottom: '1.5px solid var(--color-pencil)', padding: '5px 2px', ...handFont, fontSize: 18, color: 'var(--color-blue-pen)' }}
            />

            {/* 描述 */}
            <label className="block mb-1" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>主题描述</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full border-none outline-none bg-transparent mb-4 resize-none"
              style={{ borderBottom: '1.5px solid var(--color-pencil)', padding: '5px 2px', ...handAlt, fontSize: 15, color: 'var(--color-ink)' }}
            />

            {/* 产物 */}
            <label className="block mb-1" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>预期产物（逗号分隔）</label>
            <input
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              className="w-full border-none outline-none bg-transparent mb-4"
              style={{ borderBottom: '1.5px solid var(--color-pencil)', padding: '5px 2px', ...handFont, fontSize: 15, color: 'var(--color-ink)' }}
            />

            {/* 模式 */}
            <label className="block mb-2" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>空间模式</label>
            <div className="flex gap-2 mb-2">
              {(['AUTO', 'PRO'] as SpaceMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg cursor-pointer border-2 transition-all"
                  style={{
                    ...handFont, fontSize: 15,
                    borderColor: mode === m ? (m === 'AUTO' ? 'var(--color-blue-pen)' : 'var(--color-red-pen)') : 'rgba(42,42,42,0.1)',
                    background: mode === m ? (m === 'AUTO' ? 'rgba(58,107,197,0.06)' : 'rgba(201,74,74,0.06)') : 'transparent',
                    color: mode === m ? (m === 'AUTO' ? 'var(--color-blue-pen)' : 'var(--color-red-pen)') : 'var(--color-pencil)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          {/* 高级选项 */}
          <section className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer mb-3"
              style={{ ...handFont, fontSize: 16, color: 'var(--color-pencil)' }}
            >
              <ChevronRight
                size={16}
                style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
              />
              高级选项
            </button>
            {showAdvanced && (
              <div>
                <label className="block mb-1" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="自定义 Agent 行为..."
                  rows={5}
                  className="w-full border-none outline-none bg-transparent resize-none mb-3"
                  style={{ borderBottom: '1px solid var(--color-pencil)', padding: '4px 2px', ...handSm, fontSize: 13, color: 'var(--color-ink)' }}
                />
                <p style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)', lineHeight: 1.5 }}>
                  修改配置后即时生效，不影响已有对话历史和产物。
                </p>
              </div>
            )}
          </section>

          {/* 保存 */}
          <button
            onClick={handleSave}
            disabled={!label.trim() || saving}
            className="w-full py-2.5 rounded-md border-none cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            style={{ ...handFont, fontSize: 18, background: 'var(--color-blue-pen)', color: '#fff' }}
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </>
  )
}
