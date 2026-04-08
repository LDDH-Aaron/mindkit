/**
 * 共享基础配置 — 与具体 preset 无关的框架级指令。
 * space-factory 在组装 systemPrompt 时自动追加。
 */

/** 框架级 system prompt 后缀：tool 使用规则（所有 space 共享） */
export const BASE_SYSTEM_SUFFIX = `

## 工具使用规则
- 当识别到一个独立的子话题（如竞品分析、用户画像、技术方案等），**必须立即调用** stello_create_session
- 调用时必须提供：
  - label：子会话名称，如「竞品分析」「用户画像」
  - systemPrompt：该子话题专家的系统提示词，明确限定它只负责该方向
- 可以提供 prompt 作为子会话的第一条消息，帮助它立即进入工作状态
- 不要等用户明确要求，根据对话上下文主动判断
`.trim()
