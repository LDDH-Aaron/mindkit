import { describe, it, expect, beforeEach } from 'vitest'
import { loadPresets } from '../preset/preset-loader'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

const validPreset = {
  name: 'Test',
  description: 'A test preset',
  systemPrompt: 'You are helpful.',
  forkProfiles: [],
  skills: [],
  llm: { model: 'claude-sonnet-4-20250514' },
  consolidatePrompt: null,
  integratePrompt: null,
}

describe('loadPresets', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'presets-'))
  })

  it('returns empty array for empty directory', async () => {
    expect(await loadPresets(tmpDir)).toEqual([])
  })

  it('loads a valid preset with correct dirName', async () => {
    const dir = path.join(tmpDir, 'my-preset')
    fs.mkdirSync(dir)
    fs.writeFileSync(path.join(dir, 'preset.json'), JSON.stringify(validPreset))
    const presets = await loadPresets(tmpDir)
    expect(presets).toHaveLength(1)
    expect(presets[0]!.dirName).toBe('my-preset')
    expect(presets[0]!.name).toBe('Test')
  })

  it('skips directories without preset.json', async () => {
    fs.mkdirSync(path.join(tmpDir, 'empty-dir'))
    expect(await loadPresets(tmpDir)).toEqual([])
  })

  it('loads multiple presets', async () => {
    for (const name of ['a', 'b', 'c']) {
      const dir = path.join(tmpDir, name)
      fs.mkdirSync(dir)
      fs.writeFileSync(path.join(dir, 'preset.json'), JSON.stringify({ ...validPreset, name }))
    }
    const presets = await loadPresets(tmpDir)
    expect(presets).toHaveLength(3)
  })

  it('skips files (non-directories)', async () => {
    fs.writeFileSync(path.join(tmpDir, 'some-file.json'), '{}')
    expect(await loadPresets(tmpDir)).toEqual([])
  })
})
