import type { SpaceMeta, PresetSummary, SessionTreeNode, TurnRecord, TurnResult, SpaceEvent } from './types'

const BASE = '/api'

/** 通用 fetch 封装 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

/* ── Presets ── */

export function fetchPresets(): Promise<PresetSummary[]> {
  return request('/presets')
}

/* ── Spaces ── */

export function fetchSpaces(): Promise<SpaceMeta[]> {
  return request('/spaces')
}

export function createSpace(body: {
  name: string
  presetDirName: string
  emoji?: string
  color?: string
  description?: string
  mode?: 'AUTO' | 'PRO'
  expectedArtifacts?: string
  [key: string]: unknown
}): Promise<SpaceMeta> {
  return request('/spaces', { method: 'POST', body: JSON.stringify(body) })
}

export function deleteSpace(id: string): Promise<void> {
  return request(`/spaces/${id}`, { method: 'DELETE' })
}

/* ── Topology ── */

export function fetchTopology(spaceId: string): Promise<SessionTreeNode> {
  return request(`/spaces/${spaceId}/topology`)
}

/* ── Session ── */

/** 进入 session（对齐 devtools，turn 前调用） */
export function enterSession(spaceId: string, sessionId: string): Promise<unknown> {
  return request(`/spaces/${spaceId}/sessions/${sessionId}/enter`, { method: 'POST' })
}

/* ── Chat ── */

/** 发送消息，返回完整 turn result（对齐 devtools response 格式） */
export function sendTurn(
  spaceId: string,
  sessionId: string,
  message: string,
): Promise<TurnResult> {
  return request(`/spaces/${spaceId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
  })
}

/* ── Session Records ── */

export function fetchRecords(
  spaceId: string,
  sessionId: string,
): Promise<{ records: TurnRecord[] }> {
  return request(`/spaces/${spaceId}/sessions/${sessionId}/records`)
}

/* ── Events ── */

export function fetchEvents(
  spaceId: string,
  limit = 100,
): Promise<{ events: SpaceEvent[] }> {
  return request(`/spaces/${spaceId}/events?limit=${limit}`)
}
