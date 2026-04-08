/** Space 元数据（对应后端 SpaceMeta） */
export interface SpaceMeta {
  id: string
  name: string
  presetDirName: string
  createdAt: string
  emoji: string
  color: string
  description?: string
  mode: 'AUTO' | 'PRO'
  expectedArtifacts?: string
}

/** Preset 摘要 */
export interface PresetSummary {
  dirName: string
  name: string
  description: string
}

/** 递归拓扑树节点（core SessionTreeNode） */
export interface SessionTreeNode {
  id: string
  label: string
  sourceSessionId?: string
  status: 'active' | 'archived'
  turnCount: number
  children: SessionTreeNode[]
}

/** 扁平拓扑节点（TopologyCanvas 消费） */
export interface TopoNode {
  id: string
  label: string
  parentId: string | null
  status: 'active' | 'archived'
  turns: number
  children: string[]
}

/** L3 对话记录（含 tool 消息和 metadata） */
export interface TurnRecord {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  metadata?: {
    toolCallId?: string
    toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>
  } & Record<string, unknown>
}

/** Tool call 详情（turn 响应中） */
export interface ToolCallDetail {
  id: string
  name: string
  args: Record<string, unknown>
  success?: boolean
  data?: unknown
  error?: string | null
  duration?: number
}

/** Turn 响应（对齐 devtools TurnResult 格式） */
export interface TurnResult {
  turn: {
    finalContent: string | null
    rawResponse: string
    toolRoundCount: number
    toolCallsExecuted: number
    toolCalls?: ToolCallDetail[]
  }
}

/** WS 服务端消息 */
export type WsMessage =
  | { type: 'chunk'; content: string }
  | { type: 'done'; sessionId: string }
  | { type: 'error'; message: string }
  | { type: 'space_event'; event: SpaceEvent }

/** 系统事件 */
export interface SpaceEvent {
  id: string
  at: string
  kind: string
  payload: Record<string, unknown>
}
