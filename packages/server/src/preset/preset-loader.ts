import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Preset 配置（Kit Market 商品），字段与手动创建 Kit 对齐。
 * 每个 preset 目录下有一个 preset.json。
 */
export interface PresetConfig {
  /** 目录名（唯一标识，运行时填充） */
  dirName: string
  /** 显示名称 */
  name: string
  /** 简要描述 */
  description: string
  /** 图标 emoji */
  emoji: string
  /** 主题颜色 */
  color: string
  /** 空间模式：AUTO 自动分裂 / PRO 确认后分裂 */
  mode: 'AUTO' | 'PRO'
  /** 预期产物描述 */
  expectedArtifacts: string
  /** 领域特定的系统提示词（不含工具使用说明，由框架层自动追加） */
  systemPrompt: string
  /** 预注册的 fork profile 列表 */
  forkProfiles: Array<{
    name: string
    systemPrompt?: string
    systemPromptMode?: 'preset' | 'prepend' | 'append'
    context?: 'none' | 'inherit'
    skills?: string[]
  }>
  /** 技能列表 */
  skills: Array<{
    name: string
    description: string
    content: string
  }>
  /** 默认 LLM 模型 */
  llm: { model: string }
  /** 自定义 consolidation prompt（null 使用默认） */
  consolidatePrompt: string | null
  /** 自定义 integration prompt（null 使用默认） */
  integratePrompt: string | null
}

/** 扫描目录加载所有 preset */
export async function loadPresets(presetsDir: string): Promise<PresetConfig[]> {
  let names: string[]
  try {
    const entries = await fs.readdir(presetsDir, { withFileTypes: true })
    names = entries.filter((e) => e.isDirectory()).map((e) => String(e.name))
  } catch {
    return []
  }

  const results: PresetConfig[] = []
  for (const dirName of names) {
    try {
      const raw = await fs.readFile(
        path.join(presetsDir, dirName, 'preset.json'),
        'utf-8',
      )
      const parsed = JSON.parse(raw) as Omit<PresetConfig, 'dirName'>
      results.push({
        ...parsed,
        dirName,
        // 兼容旧格式：缺少字段时给默认值
        emoji: parsed.emoji ?? '🧠',
        color: parsed.color ?? '#6366f1',
        mode: parsed.mode ?? 'AUTO',
        expectedArtifacts: parsed.expectedArtifacts ?? '',
      })
    } catch {
      // 跳过无效目录
    }
  }
  return results
}
