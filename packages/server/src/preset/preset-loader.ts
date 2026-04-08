import * as fs from 'node:fs/promises'
import * as path from 'node:path'

/** preset 配置结构，对应 preset.json 的解析结果 */
export interface PresetConfig {
  dirName: string           // preset 目录名，唯一标识
  name: string
  description: string
  systemPrompt: string
  forkProfiles: Array<{
    name: string
    systemPrompt?: string
    systemPromptMode?: 'preset' | 'prepend' | 'append'
    context?: 'none' | 'inherit'
    skills?: string[]
  }>
  skills: Array<{
    name: string
    description: string
    content: string
  }>
  llm: { model: string }
  consolidatePrompt: string | null
  integratePrompt: string | null
}

/** 扫描 presetsDir 下每个子目录的 preset.json，返回解析后的配置列表 */
export async function loadPresets(presetsDir: string): Promise<PresetConfig[]> {
  const entries = await fs.readdir(presetsDir, { withFileTypes: true })
  const results: PresetConfig[] = []

  for (const entry of entries) {
    // 只处理目录，跳过普通文件
    if (!entry.isDirectory()) continue

    const dirName = entry.name
    const presetPath = path.join(presetsDir, dirName, 'preset.json')

    try {
      const raw = await fs.readFile(presetPath, 'utf-8')
      const parsed = JSON.parse(raw) as Omit<PresetConfig, 'dirName'>
      results.push({ dirName, ...parsed })
    } catch {
      // preset.json 不存在或 JSON 解析失败时跳过
    }
  }

  return results
}
