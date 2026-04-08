/** MindKit API 客户端 — mock 模式（后端未就绪时使用内存数据） */

const MOCK = true

/* ─── Types ─── */

export type SpaceMode = 'AUTO' | 'PRO'

export interface Space {
  id: string
  label: string
  description: string
  emoji: string
  color: string
  mode: SpaceMode
  deliverables: string[]
  systemPrompt: string
  createdAt: string
  lastActiveAt: string
  /** Fork 来源 kitId（模板模式） */
  sourceKitId?: string
}

export interface Product {
  id: string
  type: string
  title: string
  summary: string
  sourceNodeIds: string[]
  content: string
  createdAt: string
  updatedAt: string
}

export interface SpaceEvent {
  id: string
  type: 'node_created' | 'node_activated' | 'l2_updated' | 'insight_generated' | 'product_created' | 'product_updated' | 'cross_node_link'
  description: string
  nodeId?: string
  relatedNodeIds?: string[]
  timestamp: string
}

export interface Insight {
  id: string
  content: string
  sourceNodeIds: string[]
  sourceLabels: string[]
  timestamp: string
}

export interface SessionTreeNode {
  id: string
  label: string
  sourceSessionId?: string
  status: 'active' | 'archived'
  /** 模板模式下的激活状态 */
  activationStatus?: 'activated' | 'inactive' | 'user-extended'
  /** 模板预设的引导问题 */
  guideQuestion?: string
  turnCount: number
  children: SessionTreeNode[]
}

export interface TurnRecord {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface TurnResult {
  response: string
  records: TurnRecord[]
}

export interface MarketKit {
  id: string
  label: string
  description: string
  author: string
  forks: number
  tags: string[]
}

export interface PublishedKit {
  id: string
  spaceId: string
  label: string
  description: string
  tags: string[]
  forks: number
  publishedAt: string
}

/* ─── Mock 数据 ─── */

let mockSpaces: Space[] = [
  { id: 'sp-1', label: 'AI 产品头脑风暴', emoji: '🧠', color: '#3a6bc5', mode: 'AUTO', deliverables: ['PRD 文档', '技术方案'], description: '围绕 AI Native 产品方向展开发散讨论，涵盖用户画像、核心场景和 MVP 功能定义', systemPrompt: '', createdAt: '2026-04-08T00:00:00Z', lastActiveAt: '2026-04-09T14:30:00Z' },
  { id: 'sp-2', label: '技术架构评审', emoji: '⚙️', color: '#c94a4a', mode: 'PRO', deliverables: ['架构评审报告'], description: '对微服务拆分方案进行多角度评审，重点关注性能瓶颈、可扩展性和部署策略', systemPrompt: '', createdAt: '2026-04-07T00:00:00Z', lastActiveAt: '2026-04-09T10:15:00Z' },
  { id: 'sp-3', label: '创业 BP 撰写', emoji: '📊', color: '#5ba85b', mode: 'AUTO', deliverables: ['商业计划书', '财务模型'], description: '从市场分析到财务模型，逐步推演完整商业计划书，聚焦投资人关注的关键指标', systemPrompt: '', createdAt: '2026-04-06T00:00:00Z', lastActiveAt: '2026-04-08T18:00:00Z', sourceKitId: 'mk-4' },
]

const mockTrees: Record<string, SessionTreeNode[]> = {
  // ── Space 1: AI 产品头脑风暴 ──
  'sp-1': [
    {
      id: 's1-main', label: '核心构思', status: 'active', turnCount: 5, children: [
        {
          id: 's1-ux', label: 'UX 设计', status: 'active', turnCount: 4, children: [
            { id: 's1-ux-mobile', label: '移动端适配', status: 'active', turnCount: 2, children: [] },
            { id: 's1-ux-a11y', label: '无障碍方案', status: 'active', turnCount: 1, children: [] },
          ],
        },
        {
          id: 's1-backend', label: '后端架构', status: 'active', turnCount: 3, sourceSessionId: 's1-ux', children: [
            { id: 's1-db', label: '数据模型', status: 'active', turnCount: 2, children: [] },
            {
              id: 's1-api', label: 'API 设计', status: 'active', turnCount: 2, sourceSessionId: 's1-ux-mobile', children: [
                { id: 's1-api-auth', label: '鉴权方案', status: 'active', turnCount: 1, children: [] },
              ],
            },
          ],
        },
        {
          id: 's1-ai', label: 'AI 能力', status: 'active', turnCount: 3, children: [
            { id: 's1-ai-rag', label: 'RAG 检索', status: 'active', turnCount: 2, sourceSessionId: 's1-db', children: [] },
            { id: 's1-ai-agent', label: 'Agent 编排', status: 'active', turnCount: 1, children: [] },
          ],
        },
      ],
    },
  ],
  // ── Space 2: 技术架构评审 ──
  'sp-2': [
    {
      id: 's2-main', label: '架构总览', status: 'active', turnCount: 4, children: [
        {
          id: 's2-micro', label: '微服务拆分', status: 'active', turnCount: 3, children: [
            { id: 's2-micro-gw', label: '网关设计', status: 'active', turnCount: 2, children: [] },
            { id: 's2-micro-mq', label: '消息队列', status: 'active', turnCount: 2, children: [] },
            { id: 's2-micro-svc', label: '服务注册', status: 'active', turnCount: 1, sourceSessionId: 's2-micro-gw', children: [] },
          ],
        },
        {
          id: 's2-infra', label: '基础设施', status: 'active', turnCount: 3, children: [
            { id: 's2-infra-k8s', label: 'K8s 部署', status: 'active', turnCount: 2, children: [] },
            { id: 's2-infra-ci', label: 'CI/CD 流水线', status: 'active', turnCount: 2, sourceSessionId: 's2-micro', children: [] },
          ],
        },
        {
          id: 's2-perf', label: '性能优化', status: 'active', turnCount: 2, sourceSessionId: 's2-micro-mq', children: [
            { id: 's2-perf-cache', label: '缓存策略', status: 'active', turnCount: 1, children: [] },
            { id: 's2-perf-db', label: 'DB 调优', status: 'active', turnCount: 1, children: [] },
          ],
        },
      ],
    },
  ],
  // ── Space 3: 创业 BP 撰写 ──
  'sp-3': [
    {
      id: 's3-main', label: 'BP 大纲', status: 'active', turnCount: 4, children: [
        {
          id: 's3-market', label: '市场分析', status: 'active', turnCount: 3, children: [
            { id: 's3-market-tam', label: 'TAM 测算', status: 'active', turnCount: 2, children: [] },
            { id: 's3-market-comp', label: '竞品对比', status: 'active', turnCount: 2, children: [] },
          ],
        },
        {
          id: 's3-product', label: '产品方案', status: 'active', turnCount: 3, sourceSessionId: 's3-market', children: [
            { id: 's3-product-mvp', label: 'MVP 定义', status: 'active', turnCount: 2, children: [] },
            { id: 's3-product-roadmap', label: '路线图', status: 'active', turnCount: 1, sourceSessionId: 's3-market-tam', children: [] },
          ],
        },
        {
          id: 's3-finance', label: '财务模型', status: 'active', turnCount: 2, children: [
            { id: 's3-finance-rev', label: '营收预测', status: 'active', turnCount: 2, sourceSessionId: 's3-market-tam', children: [] },
            { id: 's3-finance-cost', label: '成本结构', status: 'active', turnCount: 1, children: [] },
          ],
        },
        {
          id: 's3-team', label: '团队介绍', status: 'active', turnCount: 1, children: [],
        },
      ],
    },
  ],
}

/** Mock L2 内容 */
const mockL2: Record<string, string> = {
  // Space 1
  's1-main': '总协调节点：统筹 UX、后端、AI 三条探索线，追踪产品核心定位和架构决策。',
  's1-ux': '探索 UI 布局方案、组件层级和视觉风格，输出设计规范供后端和 AI 线参考。',
  's1-ux-mobile': '移动端响应式适配策略，包括触摸交互、离线缓存和 PWA 方案。',
  's1-ux-a11y': '无障碍访问设计：屏幕阅读器兼容、键盘导航、高对比度模式。',
  's1-backend': '后端服务架构设计，引用 UX 线的接口需求定义 API 契约。',
  's1-db': '数据模型设计：核心实体关系、索引策略、分库分表方案。',
  's1-api': 'RESTful API 设计，结合移动端需求做字段裁剪和分页优化。',
  's1-api-auth': 'JWT + OAuth2.0 鉴权方案，支持多端登录和权限分级。',
  's1-ai': 'AI 能力规划：RAG 检索增强、Agent 多步编排、模型选型。',
  's1-ai-rag': 'RAG 方案设计：向量库选型、chunk 策略、引用数据模型的 embedding 方案。',
  's1-ai-agent': 'Agent 编排框架：工具调用协议、多轮对话状态机、错误恢复。',
  // Space 2
  's2-main': '架构评审总览：梳理现有系统痛点，规划微服务化路径和基础设施升级。',
  's2-micro': '微服务拆分策略：领域边界划分、服务通信协议、数据一致性方案。',
  's2-micro-gw': 'API 网关设计：限流熔断、协议转换、灰度路由策略。',
  's2-micro-mq': '消息队列选型与设计：Kafka vs RabbitMQ、消息顺序性、死信处理。',
  's2-micro-svc': '服务注册发现：Consul/Nacos 选型、健康检查、引用网关配置联动。',
  's2-infra': '基础设施规划：容器化部署、监控告警、日志聚合。',
  's2-infra-k8s': 'K8s 集群设计：节点规划、HPA 策略、存储卷方案。',
  's2-infra-ci': 'CI/CD 流水线设计：引用微服务拆分的构建单元，多环境部署策略。',
  's2-perf': '性能优化专题：引用消息队列的异步化方案，关注 P99 延迟。',
  's2-perf-cache': '多级缓存策略：本地缓存 + Redis + CDN，缓存失效和穿透防护。',
  's2-perf-db': '数据库调优：慢查询分析、读写分离、连接池配置。',
  // Space 3
  's3-main': 'BP 大纲协调：串联市场、产品、财务、团队四个章节，保持叙事一致性。',
  's3-market': '市场分析：行业趋势、目标客群画像、市场规模测算。',
  's3-market-tam': 'TAM/SAM/SOM 三层市场规模测算，引用行业报告数据。',
  's3-market-comp': '竞品分析矩阵：功能对比、定价策略、差异化定位。',
  's3-product': '产品方案：引用市场分析结论定义核心功能和用户价值。',
  's3-product-mvp': 'MVP 功能范围：核心用户旅程、优先级排序、上线标准。',
  's3-product-roadmap': '产品路线图：引用 TAM 数据规划阶段性目标和里程碑。',
  's3-finance': '财务模型：营收预测、成本结构、盈亏平衡分析。',
  's3-finance-rev': '营收预测模型：引用 TAM 数据，分场景预估 ARR 增长曲线。',
  's3-finance-cost': '成本结构分析：研发人力、基础设施、获客成本拆解。',
  's3-team': '团队介绍：核心成员背景、互补能力矩阵、招聘计划。',
}

/** Mock L3 对话记录 */
const mockMessages: Record<string, TurnRecord[]> = {
  // ── Space 1: AI 产品头脑风暴 ──
  's1-main': [
    { role: 'user', content: '我想做一个 AI Native 的思维协作工具，核心理念是让 AI 参与到思考过程而不只是问答', timestamp: '2026-04-08T09:00:00Z' },
    { role: 'assistant', content: '很棒的方向！AI Native 协作工具的关键在于：1) 思维的结构化——用拓扑图而非线性对话；2) AI 的主动性——不只回答问题，还能主动发现关联和提出建议；3) 多线程探索——允许思维分叉并行深入。', timestamp: '2026-04-08T09:01:00Z' },
    { role: 'user', content: '对，我设计了一个 session tree 的概念，每个节点是一个独立对话，节点之间有关联', timestamp: '2026-04-08T09:02:00Z' },
    { role: 'assistant', content: '这正是 Stello SDK 的核心模型。建议分三条线并行探索：UX 设计（交互怎么呈现拓扑）、后端架构（session tree 如何持久化和同步）、AI 能力（如何实现跨节点的意识和记忆）。', timestamp: '2026-04-08T09:03:00Z' },
  ],
  's1-ux': [
    { role: 'user', content: '拓扑图用什么风格呈现？我希望不要太严肃', timestamp: '2026-04-08T09:10:00Z' },
    { role: 'assistant', content: '推荐手绘涂鸦风格（Clean Doodle）：手写字体、抖动线条、素描填充节点。这种风格暗示"草稿/思考中"，降低用户对输出完美度的期待，鼓励更自由的探索。', timestamp: '2026-04-08T09:11:00Z' },
    { role: 'user', content: '很好！字体用什么？', timestamp: '2026-04-08T09:12:00Z' },
    { role: 'assistant', content: '建议用 Caveat 作为主标题手写体，Patrick Hand 用于正文，Coming Soon 用于小标签。纸张底色用暖白 #f7f4ee，笔迹用深灰 #2a2a2a，重点标记用蓝色和红色笔迹。', timestamp: '2026-04-08T09:13:00Z' },
  ],
  's1-ux-mobile': [
    { role: 'user', content: '移动端拓扑图怎么交互？Canvas 触摸体验不太好', timestamp: '2026-04-08T10:00:00Z' },
    { role: 'assistant', content: '移动端建议：1) 拓扑图简化为可展开的树形列表；2) 支持双指缩放和单指拖拽；3) 点击节点全屏进入对话，顶部面包屑导航回拓扑。核心是保留思维结构感，但适配小屏交互。', timestamp: '2026-04-08T10:01:00Z' },
  ],
  's1-ux-a11y': [
    { role: 'user', content: '无障碍方面需要注意什么？', timestamp: '2026-04-08T10:20:00Z' },
    { role: 'assistant', content: '核心考虑：1) 拓扑图要有可访问的文本替代——屏幕阅读器读出节点列表和层级关系；2) 键盘导航——Tab/方向键在节点间移动，Enter 进入对话；3) 高对比度模式——涂鸦风格的低对比度线条需要备选方案。建议用 ARIA tree role 标记拓扑结构。', timestamp: '2026-04-08T10:21:00Z' },
  ],
  's1-backend': [
    { role: 'user', content: '后端怎么设计？需要支持 session tree 的 CRUD 和实时同步', timestamp: '2026-04-08T09:20:00Z' },
    { role: 'assistant', content: '建议用 Hono 做 HTTP API + WebSocket 做实时推送。核心接口：1) GET /sessions — 获取树结构；2) POST /sessions/:id/turn — 发送对话轮次；3) POST /sessions/:id/fork — 分叉新节点。WS 推送树结构变更和 AI 响应流。', timestamp: '2026-04-08T09:21:00Z' },
    { role: 'user', content: '存储方案呢？不想用数据库', timestamp: '2026-04-08T09:22:00Z' },
    { role: 'assistant', content: '文件系统持久化：每个 Space 一个目录，session tree 存为 JSON，对话记录按 session 分文件。优点是本地优先、可 git 管理、无外部依赖。Stello 的 FileSystemAdapter 可以直接复用。', timestamp: '2026-04-08T09:23:00Z' },
  ],
  's1-db': [
    { role: 'user', content: '数据模型的核心实体有哪些？', timestamp: '2026-04-08T09:30:00Z' },
    { role: 'assistant', content: '三个核心实体：1) Space — 顶层容器，包含配置和 system prompt；2) Session — 树节点，有 parentId 和 sourceSessionId；3) Turn — 对话轮次，属于某个 Session。关系：Space 1:N Session（树形），Session 1:N Turn（有序列表）。', timestamp: '2026-04-08T09:31:00Z' },
  ],
  's1-api': [
    { role: 'user', content: 'API 要考虑移动端的网络情况，怎么优化？', timestamp: '2026-04-08T10:10:00Z' },
    { role: 'assistant', content: '移动端 API 优化：1) 树结构一次性返回（通常不大）避免多次请求；2) 对话消息分页加载，首屏只取最近 20 条；3) AI 响应用 SSE 流式推送减少等待感；4) 支持离线缓存 + 上线后增量同步。', timestamp: '2026-04-08T10:11:00Z' },
  ],
  's1-api-auth': [
    { role: 'user', content: '鉴权方案用 JWT 还是 session cookie？', timestamp: '2026-04-08T10:30:00Z' },
    { role: 'assistant', content: 'JWT + OAuth2.0 更适合我们的场景：1) 无状态——文件系统后端不想维护 session store；2) 跨端——移动端和 Web 端用同一套 token；3) 支持第三方登录。建议 access token 15 分钟过期 + refresh token 7 天，权限分 owner/editor/viewer 三级。', timestamp: '2026-04-08T10:31:00Z' },
  ],
  's1-ai': [
    { role: 'user', content: 'AI 能力整体怎么规划？', timestamp: '2026-04-08T11:00:00Z' },
    { role: 'assistant', content: 'AI 能力分三层：1) L3——节点内对话，基础的上下文问答；2) L2——节点摘要记忆，自动提炼每个节点的核心结论；3) L1——跨节点意识，通过 RAG 检索整棵树的相关片段注入上下文。另外要规划 Agent 编排能力，支持工具调用和多步推理。', timestamp: '2026-04-08T11:01:00Z' },
  ],
  's1-ai-rag': [
    { role: 'user', content: 'RAG 怎么和 session tree 结合？', timestamp: '2026-04-08T11:10:00Z' },
    { role: 'assistant', content: '每个 Session 的对话内容做 embedding 存入向量库。当用户在某个节点提问时，不仅检索当前节点历史，还检索整棵树的相关片段——这就是跨节点的 L1 意识。检索结果带上来源节点 ID，AI 可以主动建议"这和 design 节点的讨论相关"。', timestamp: '2026-04-08T11:11:00Z' },
  ],
  's1-ai-agent': [
    { role: 'user', content: 'Agent 编排具体怎么做？', timestamp: '2026-04-08T11:30:00Z' },
    { role: 'assistant', content: 'Agent 编排框架设计：1) 工具注册——声明式定义可用工具（搜索、代码执行、文件读写）；2) 状态机——user→plan→tool_call→observe→respond 循环；3) 错误恢复——工具失败时自动重试或切换策略；4) 多 Agent 协作——不同节点可以运行不同 Agent profile，互相通过 L1 共享上下文。', timestamp: '2026-04-08T11:31:00Z' },
  ],
  // ── Space 2: 技术架构评审 ──
  's2-main': [
    { role: 'user', content: '现有单体服务已经扛不住了，需要做微服务化改造', timestamp: '2026-04-07T14:00:00Z' },
    { role: 'assistant', content: '微服务化改造建议分三步走：1) 先梳理领域边界，确定服务拆分粒度；2) 搭建基础设施（网关、注册中心、CI/CD）；3) 逐个服务剥离，从耦合度最低的开始。同时需要关注性能，异步化是关键。', timestamp: '2026-04-07T14:01:00Z' },
    { role: 'user', content: '目前最大的痛点是数据库单点和部署效率', timestamp: '2026-04-07T14:02:00Z' },
    { role: 'assistant', content: '数据库单点可以通过读写分离 + 分库先缓解。部署效率靠容器化 + CI/CD 自动化。建议开三条并行探索线：微服务拆分策略、基础设施升级、性能优化专题。', timestamp: '2026-04-07T14:03:00Z' },
  ],
  's2-micro': [
    { role: 'user', content: '服务怎么拆？按业务域还是按功能？', timestamp: '2026-04-07T14:10:00Z' },
    { role: 'assistant', content: '按业务域（DDD bounded context）拆分更合理：每个服务对应一个领域上下文，数据自治，通过事件驱动通信。避免按功能层（前端/后端/数据）横切，那样服务间调用会爆炸。', timestamp: '2026-04-07T14:11:00Z' },
    { role: 'user', content: '服务间通信用 gRPC 还是 HTTP？', timestamp: '2026-04-07T14:12:00Z' },
    { role: 'assistant', content: '内部同步调用用 gRPC（高性能、强类型、支持流），对外网关暴露 HTTP/JSON。异步通信一律走消息队列。这样既保证内部效率，又不影响外部兼容性。', timestamp: '2026-04-07T14:13:00Z' },
  ],
  's2-micro-gw': [
    { role: 'user', content: '网关需要哪些核心能力？', timestamp: '2026-04-07T14:20:00Z' },
    { role: 'assistant', content: '核心能力清单：1) 路由转发——按路径/Header 分发到后端服务；2) 限流熔断——保护后端不被打垮；3) 鉴权——统一验证 JWT；4) 灰度路由——按用户/比例分流到新版本；5) 协议转换——外部 HTTP 转内部 gRPC。推荐 Kong 或 APISIX。', timestamp: '2026-04-07T14:21:00Z' },
  ],
  's2-micro-mq': [
    { role: 'user', content: 'Kafka 和 RabbitMQ 选哪个？', timestamp: '2026-04-07T14:30:00Z' },
    { role: 'assistant', content: '看场景：Kafka 适合高吞吐、日志流、事件溯源（我们的主场景）；RabbitMQ 适合低延迟、复杂路由、任务队列。建议核心事件流用 Kafka，轻量任务分发用 RabbitMQ，不冲突。', timestamp: '2026-04-07T14:31:00Z' },
  ],
  's2-micro-svc': [
    { role: 'user', content: '服务注册发现用什么方案？', timestamp: '2026-04-07T14:40:00Z' },
    { role: 'assistant', content: '推荐 Consul：1) 支持健康检查——主动探测服务存活，自动摘除故障实例；2) KV 存储——可以存网关路由配置，和网关联动；3) 多数据中心——方便后续扩展。备选 Nacos（如果团队偏 Java 生态）。关键是服务启动时自动注册，关闭时优雅下线。', timestamp: '2026-04-07T14:41:00Z' },
  ],
  's2-infra': [
    { role: 'user', content: '基础设施整体怎么规划？', timestamp: '2026-04-07T14:50:00Z' },
    { role: 'assistant', content: '三大支柱：1) 容器化部署——K8s 统管所有服务的生命周期；2) 可观测性——日志（ELK）+ 指标（Prometheus）+ 链路追踪（Jaeger）三件套；3) CI/CD 自动化——代码提交到部署全流程 < 15 分钟。优先搞 K8s 和 CI/CD，可观测性可以渐进式搭建。', timestamp: '2026-04-07T14:51:00Z' },
  ],
  's2-infra-k8s': [
    { role: 'user', content: 'K8s 集群怎么规划节点？', timestamp: '2026-04-07T15:00:00Z' },
    { role: 'assistant', content: '建议三层节点池：1) 系统节点池（3 节点）——运行 ingress、监控、日志；2) 应用节点池（可伸缩）——运行业务服务，配 HPA 自动扩缩；3) 计算节点池（按需）——跑批处理和 AI 推理任务。存储用 CSI 接云盘。', timestamp: '2026-04-07T15:01:00Z' },
  ],
  's2-infra-ci': [
    { role: 'user', content: 'CI/CD 流水线怎么设计？', timestamp: '2026-04-07T15:10:00Z' },
    { role: 'assistant', content: '四阶段流水线：1) Build——每个微服务独立构建 Docker 镜像，引用拆分后的构建单元；2) Test——单元测试 + 集成测试（引用服务间契约）；3) Stage——自动部署到 staging 环境，跑 E2E 测试；4) Deploy——灰度发布到生产，配合网关做流量切换。工具链推荐 GitHub Actions + ArgoCD。', timestamp: '2026-04-07T15:11:00Z' },
  ],
  's2-perf': [
    { role: 'user', content: '性能优化从哪里入手？', timestamp: '2026-04-07T15:20:00Z' },
    { role: 'assistant', content: '三个方向：1) 缓存——多级缓存减少 DB 压力，这是见效最快的；2) 异步化——引用消息队列方案，把非关键路径异步处理；3) DB 调优——慢查询分析、索引优化、连接池调参。建议先做缓存，立竿见影。目标把 P99 延迟从 2s 降到 200ms。', timestamp: '2026-04-07T15:21:00Z' },
  ],
  's2-perf-cache': [
    { role: 'user', content: '缓存穿透怎么防？', timestamp: '2026-04-07T15:30:00Z' },
    { role: 'assistant', content: '三板斧：1) 布隆过滤器——请求到达前先判断 key 是否可能存在；2) 空值缓存——查不到也缓存一个短 TTL 的空值；3) 热点 key 发现——监控 QPS 最高的 key，主动预热。另外缓存雪崩用随机 TTL + 互斥锁防范。', timestamp: '2026-04-07T15:31:00Z' },
  ],
  's2-perf-db': [
    { role: 'user', content: 'DB 调优具体怎么做？', timestamp: '2026-04-07T15:40:00Z' },
    { role: 'assistant', content: '四步走：1) 开慢查询日志——找出 > 100ms 的 SQL，逐条优化索引；2) 读写分离——主库写、从库读，配合缓存减轻主库压力；3) 连接池调参——根据服务数和并发量设置合理的 pool size；4) 分库分表——热点表按业务维度水平拆分。工具推荐 pt-query-digest 分析慢查询。', timestamp: '2026-04-07T15:41:00Z' },
  ],
  // ── Space 3: 创业 BP 撰写 ──
  's3-main': [
    { role: 'user', content: '我要写一份 BP，面向天使轮投资人，产品方向是 AI 协作工具', timestamp: '2026-04-06T10:00:00Z' },
    { role: 'assistant', content: 'BP 结构建议：1) 市场分析——证明赛道够大；2) 产品方案——说清楚解决什么问题、怎么解决；3) 财务模型——营收预测和成本结构；4) 团队介绍——为什么是你们。天使轮重点讲团队和产品愿景，财务模型简洁即可。', timestamp: '2026-04-06T10:01:00Z' },
    { role: 'user', content: '好，按这四个方向分别展开', timestamp: '2026-04-06T10:02:00Z' },
    { role: 'assistant', content: '已开四条探索线。注意它们之间有依赖：市场分析的 TAM 数据会被产品路线图和营收预测引用，产品方案又依赖市场分析的用户画像。建议先把市场分析做扎实。', timestamp: '2026-04-06T10:03:00Z' },
  ],
  's3-market': [
    { role: 'user', content: 'AI 协作工具的市场现状怎么样？', timestamp: '2026-04-06T10:10:00Z' },
    { role: 'assistant', content: '2025 年全球 AI 协作工具市场约 120 亿美元，CAGR 35%。头部玩家 Notion AI、Cursor、Claude Code 聚焦单一场景，但"多线程思维协作"这个细分方向还是蓝海。关键趋势：从 copilot 到 co-thinker 的范式转移。', timestamp: '2026-04-06T10:11:00Z' },
    { role: 'user', content: '目标客群是谁？', timestamp: '2026-04-06T10:12:00Z' },
    { role: 'assistant', content: '三层客群：1) 核心——独立开发者和小团队 CTO，需要 AI 辅助架构决策；2) 扩展——产品经理和设计师，需要结构化的需求探索；3) 远期——知识工作者（咨询、研究、写作），需要深度思考辅助。天使轮聚焦第一层。', timestamp: '2026-04-06T10:13:00Z' },
  ],
  's3-market-tam': [
    { role: 'user', content: '帮我算下 TAM/SAM/SOM', timestamp: '2026-04-06T10:20:00Z' },
    { role: 'assistant', content: 'TAM：全球 AI 生产力工具市场 ~$120B（2025）。SAM：其中协作/思维辅助工具 ~$8B。SOM：第一年聚焦开发者群体，全球约 3000 万独立开发者 × $10/月 × 0.5% 渗透率 = ~$18M ARR 目标。保守但可信。', timestamp: '2026-04-06T10:21:00Z' },
  ],
  's3-market-comp': [
    { role: 'user', content: '主要竞品有哪些？我们怎么差异化？', timestamp: '2026-04-06T10:30:00Z' },
    { role: 'assistant', content: '竞品矩阵：Notion AI（文档+AI，但线性思维）、Miro AI（画布+AI，但缺乏深度对话）、ChatGPT（深度对话，但无结构化）。我们的差异化：唯一同时提供"思维拓扑 + 多线程 AI 对话 + 跨节点意识"的产品。核心壁垒是 session tree 的架构和 L1/L2/L3 记忆模型。', timestamp: '2026-04-06T10:31:00Z' },
  ],
  's3-product': [
    { role: 'user', content: '产品方案整体怎么写？', timestamp: '2026-04-06T10:40:00Z' },
    { role: 'assistant', content: '产品方案章节结构：1) 痛点描述——引用市场分析的用户画像，说明现有工具的不足；2) 解决方案——MindKit 的核心创新（session tree + 多层记忆）；3) MVP 定义——最小可行产品范围；4) 产品路线图——6/12/18 个月的里程碑。重点让投资人理解"为什么这个方案能赢"。', timestamp: '2026-04-06T10:41:00Z' },
  ],
  's3-product-mvp': [
    { role: 'user', content: 'MVP 应该包含哪些功能？', timestamp: '2026-04-06T11:00:00Z' },
    { role: 'assistant', content: 'MVP 三个核心功能：1) Space 创建和管理——用户能创建多个思维空间；2) 对话拓扑——可视化 session tree，支持分叉和节点切换；3) AI 多线程对话——每个节点独立对话，AI 有跨节点感知。砍掉：协作、Market、离线模式。目标：2 周开发，验证"拓扑思维"的核心假设。', timestamp: '2026-04-06T11:01:00Z' },
  ],
  's3-product-roadmap': [
    { role: 'user', content: '产品路线图怎么规划？', timestamp: '2026-04-06T11:10:00Z' },
    { role: 'assistant', content: '基于 TAM 数据的三阶段路线图：Phase 1（0-6 月）——MVP 上线 + 种子用户验证，目标 500 活跃用户；Phase 2（6-12 月）——Market 生态 + 团队协作，目标 5000 付费用户；Phase 3（12-18 月）——企业版 + API 开放平台，目标进入 ARR $3M。每阶段都有明确的 Go/No-Go 指标。', timestamp: '2026-04-06T11:11:00Z' },
  ],
  's3-finance': [
    { role: 'user', content: '财务模型怎么搭？', timestamp: '2026-04-06T11:20:00Z' },
    { role: 'assistant', content: '天使轮 BP 的财务模型不需要太复杂，但要有：1) 营收预测——基于 TAM/渗透率自上而下 + 基于获客漏斗自下而上双重验证；2) 成本结构——研发人力、LLM API 调用、基础设施三大块；3) 盈亏平衡——预计 Y2 Q3 达到月度盈亏平衡。关键是假设透明、逻辑自洽。', timestamp: '2026-04-06T11:21:00Z' },
  ],
  's3-finance-rev': [
    { role: 'user', content: '营收模型怎么算？', timestamp: '2026-04-06T11:30:00Z' },
    { role: 'assistant', content: '基于 TAM 节点的数据，三年预测：Y1 — 免费增值获客 5000 付费用户 × $10/月 = $600K ARR；Y2 — 增加团队版 $30/月，目标 2 万用户 = $3.6M ARR；Y3 — 企业版 + Market 分成，目标 $12M ARR。毛利率预估 75%（主要成本是 LLM API 调用）。', timestamp: '2026-04-06T11:31:00Z' },
  ],
  's3-finance-cost': [
    { role: 'user', content: '成本结构怎么拆？', timestamp: '2026-04-06T11:40:00Z' },
    { role: 'assistant', content: 'Y1 成本拆解：1) 研发人力 ~$400K（4 人全栈团队）；2) LLM API ~$120K（按 5000 用户 × 日均 20 次调用估算）；3) 基础设施 ~$36K（云服务器 + 向量库）；4) 运营/市场 ~$60K。总计 ~$616K，天使轮融 $800K 可以覆盖 12-15 个月的 runway。', timestamp: '2026-04-06T11:41:00Z' },
  ],
  's3-team': [
    { role: 'user', content: '团队介绍怎么写比较有说服力？', timestamp: '2026-04-06T12:00:00Z' },
    { role: 'assistant', content: '天使轮团队介绍重点：1) 互补能力矩阵——技术 + 产品 + 增长至少覆盖两项；2) 相关经验——之前做过类似产品或在相关领域有深度积累；3) 全职承诺——投资人最怕兼职创业。格式建议：每人一张照片 + 一句话 title + 3 个 bullet point 的核心经历。如果有知名公司背景或开源项目，一定要突出。', timestamp: '2026-04-06T12:01:00Z' },
  ],
}

/** Market Kit 预设拓扑和对话 */
interface KitPreset {
  tree: SessionTreeNode[]
  messages: Record<string, TurnRecord[]>
  l2: Record<string, string>
}

const marketPresets: Record<string, KitPreset> = {
  'mk-1': {
    tree: [
      {
        id: 'mk1-root', label: '产品定位', status: 'active', turnCount: 3, children: [
          { id: 'mk1-user', label: '用户画像', status: 'active', turnCount: 2, children: [] },
          {
            id: 'mk1-tech', label: '技术方案', status: 'active', turnCount: 2, children: [
              { id: 'mk1-tech-stack', label: '技术选型', status: 'active', turnCount: 2, children: [] },
            ],
          },
          { id: 'mk1-plan', label: '作战计划', status: 'active', turnCount: 2, sourceSessionId: 'mk1-tech', children: [] },
        ],
      },
    ],
    messages: {
      'mk1-root': [
        { role: 'user', content: '我们黑客松的主题是 AI 应用，48 小时需要出一个可演示的产品', timestamp: '2026-04-09T09:00:00Z' },
        { role: 'assistant', content: '48 小时极限开发，关键是聚焦！建议先用 10 分钟定位核心场景：1) 你要解决什么问题？2) 目标用户是谁？3) 最小可演示的功能是什么？然后分裂出用户画像、技术方案、作战计划三条线并行推进。', timestamp: '2026-04-09T09:01:00Z' },
        { role: 'user', content: '我想做一个帮人梳理复杂问题的 AI 工具，用思维导图的方式', timestamp: '2026-04-09T09:02:00Z' },
        { role: 'assistant', content: '很好的切入点！"AI 辅助的结构化思考"是有真实需求的。演示的 WOW moment 建议是：用户输入一个模糊问题，AI 自动生成多个探索方向并组织成思维拓扑。接下来分头去细化用户画像和技术实现。', timestamp: '2026-04-09T09:03:00Z' },
      ],
      'mk1-user': [
        { role: 'user', content: '目标用户是谁？黑客松评委会关注什么？', timestamp: '2026-04-09T09:10:00Z' },
        { role: 'assistant', content: '双重用户：1) 真实用户——知识工作者（PM、研究员、学生），痛点是"想不清楚复杂问题"；2) 评委——关注创新性、完成度、实用性。建议演示场景选"创业方案分析"——评委自己就是目标用户，体验最直接。', timestamp: '2026-04-09T09:11:00Z' },
      ],
      'mk1-tech': [
        { role: 'user', content: '48 小时技术方案怎么选？要快', timestamp: '2026-04-09T09:20:00Z' },
        { role: 'assistant', content: '极速方案：前端 React + Vite（热更新快），拓扑可视化用 Canvas 手绘风格（差异化），后端直接用内存 mock（省去数据库）。AI 调用 Claude API，利用 function calling 让 AI 自动建议分叉节点。核心就两个页面：首页 + 工作台。', timestamp: '2026-04-09T09:21:00Z' },
      ],
      'mk1-tech-stack': [
        { role: 'user', content: '具体技术选型定一下', timestamp: '2026-04-09T09:30:00Z' },
        { role: 'assistant', content: '锁定选型：1) React 19 + Vite + TailwindCSS（前端）；2) Canvas 2D API（拓扑绘制，手绘风格用 Caveat 字体 + 抖动算法）；3) Hono + Node.js（后端，轻量够用）；4) Claude Sonnet 4.6 API（性价比最优）；5) 文件系统存储（零配置）。不要引入任何你没用过的框架。', timestamp: '2026-04-09T09:31:00Z' },
      ],
      'mk1-plan': [
        { role: 'user', content: '48 小时怎么分配时间？', timestamp: '2026-04-09T09:40:00Z' },
        { role: 'assistant', content: '基于技术方案的时间分配：Day 1 上午（4h）——搭骨架：路由 + 布局 + Canvas 基础绘制；Day 1 下午（6h）——核心功能：对话面板 + AI 调用 + 节点增删；Day 1 晚上（4h）——拓扑交互：节点拖拽、连线、动画；Day 2 上午（4h）——润色：手绘风格、加载动画、错误处理；Day 2 下午（4h）——演示准备：录屏、PPT、彩排。留 2h buffer。', timestamp: '2026-04-09T09:41:00Z' },
      ],
    },
    l2: {
      'mk1-root': '产品定位：AI 辅助的结构化思考工具，核心演示点是从模糊问题自动生成思维拓扑。',
      'mk1-user': '双重用户定位：真实用户为知识工作者，评委即目标用户。演示场景选创业方案分析。',
      'mk1-tech': '48h 极速技术方案：React + Canvas 手绘风 + Hono 后端 + Claude API。',
      'mk1-tech-stack': '技术选型锁定：React 19 + Vite + TailwindCSS + Canvas 2D + Hono + Claude Sonnet 4.6。',
      'mk1-plan': '48h 作战计划：Day1 搭骨架→核心功能→拓扑交互，Day2 润色→演示准备，预留 2h buffer。',
    },
  },
  'mk-2': {
    tree: [
      {
        id: 'mk2-root', label: '背景评估', status: 'active', turnCount: 2, children: [
          { id: 'mk2-school', label: '选校策略', status: 'active', turnCount: 2, children: [] },
          {
            id: 'mk2-doc', label: '文书撰写', status: 'active', turnCount: 2, children: [
              { id: 'mk2-rec', label: '推荐信', status: 'active', turnCount: 2, children: [] },
            ],
          },
          { id: 'mk2-interview', label: '面试准备', status: 'active', turnCount: 2, children: [] },
          { id: 'mk2-submit', label: '提交与签证', status: 'active', turnCount: 2, sourceSessionId: 'mk2-doc', children: [] },
        ],
      },
    ],
    messages: {
      'mk2-root': [
        { role: 'user', content: '我想申请美国 CS 硕士，本科 985，GPA 3.6，有两段实习', timestamp: '2026-04-09T10:00:00Z' },
        { role: 'assistant', content: '背景评估：GPA 3.6 在 985 属于中上，CS 硕士申请竞争激烈。两段实习是加分项，关键看项目质量。建议分线规划：选校策略（定位冲刺/匹配/保底）、文书撰写、推荐信、面试准备、提交和签证。先从选校开始，定位决定一切。', timestamp: '2026-04-09T10:01:00Z' },
      ],
      'mk2-school': [
        { role: 'user', content: '选校怎么分层？', timestamp: '2026-04-09T10:10:00Z' },
        { role: 'assistant', content: '三层选校法：冲刺（3 所）——CMU、Stanford、MIT，录取率 < 10% 但值得尝试；匹配（4 所）——UIUC、GaTech、UMich、UCSD，GPA 3.6 在录取范围；保底（2 所）——NEU、USC，录取概率高且就业强。总共 8-9 所，不要太多分散精力。', timestamp: '2026-04-09T10:11:00Z' },
      ],
      'mk2-doc': [
        { role: 'user', content: 'PS 怎么写出差异化？', timestamp: '2026-04-09T10:20:00Z' },
        { role: 'assistant', content: 'PS 差异化三要素：1) 开头用一个具体的技术问题或项目故事切入，不要"从小对计算机感兴趣"；2) 把实习经历和学术兴趣串成一条线——你不是在列简历，而是讲一个"为什么是这个方向"的故事；3) 和目标学校的具体教授/项目建立连接，说明 why this school。每所学校微调 20% 内容。', timestamp: '2026-04-09T10:21:00Z' },
      ],
      'mk2-rec': [
        { role: 'user', content: '推荐信找谁写？', timestamp: '2026-04-09T10:30:00Z' },
        { role: 'assistant', content: '推荐信组合：1) 学术推荐——找最了解你的课程教授或毕设导师，能具体描述你的研究能力；2) 实习推荐——直属 mentor/manager，能说明你的工程能力和团队协作；3) 第三封——另一个教授或实习导师。关键不是推荐人的名气，而是他们能不能写出具体的故事和细节。提前 2 个月沟通，提供你的 CV 和申请方向。', timestamp: '2026-04-09T10:31:00Z' },
      ],
      'mk2-interview': [
        { role: 'user', content: '面试一般问什么？', timestamp: '2026-04-09T10:40:00Z' },
        { role: 'assistant', content: 'CS 硕士面试常见三类问题：1) 技术基础——数据结构、算法、系统设计（CMU 偏好）；2) 项目深挖——简历上的实习和项目细节，追问"遇到什么困难、怎么解决的"；3) 动机匹配——why this program、career goal、why you fit。准备一个 2 分钟的 elevator pitch，然后针对每类准备 3-5 个具体故事。Mock interview 至少做 3 轮。', timestamp: '2026-04-09T10:41:00Z' },
      ],
      'mk2-submit': [
        { role: 'user', content: '提交流程和时间线？', timestamp: '2026-04-09T10:50:00Z' },
        { role: 'assistant', content: '时间线：9 月——定校、开始文书；10 月——文书迭代、送推荐信；11 月——Early Deadline 学校提交（CMU 12/1）；12 月——常规 Deadline 批量提交；1-3 月——面试 + 等结果；4 月——择校 + 签证。签证提醒：I-20 拿到后尽早预约 F1 签证，准备存款证明（约 60 万 RMB）和 DS-160 表格。文书最终版要 match 这个时间线。', timestamp: '2026-04-09T10:51:00Z' },
      ],
    },
    l2: {
      'mk2-root': '背景评估：985 CS GPA 3.6 + 两段实习，中上水平，需要在文书和选校上做差异化。',
      'mk2-school': '三层选校：冲刺 CMU/Stanford/MIT，匹配 UIUC/GaTech/UMich/UCSD，保底 NEU/USC。',
      'mk2-doc': 'PS 核心策略：具体故事开头 + 经历串线 + why this school 定制化。',
      'mk2-rec': '推荐信组合：学术教授 + 实习 mentor + 第三方，重在具体细节而非名气。',
      'mk2-interview': '面试准备：技术基础 + 项目深挖 + 动机匹配，mock interview 至少 3 轮。',
      'mk2-submit': '提交时间线：9 月定校→12 月提交→4 月择校签证。',
    },
  },
  'mk-3': {
    tree: [
      {
        id: 'mk3-root', label: '架构总览', status: 'active', turnCount: 2, children: [
          { id: 'mk3-security', label: '安全性审查', status: 'active', turnCount: 2, children: [] },
          { id: 'mk3-scale', label: '可扩展性', status: 'active', turnCount: 2, children: [] },
          {
            id: 'mk3-perf', label: '性能分析', status: 'active', turnCount: 2, children: [
              { id: 'mk3-perf-opt', label: '优化方案', status: 'active', turnCount: 2, sourceSessionId: 'mk3-scale', children: [] },
            ],
          },
        ],
      },
    ],
    messages: {
      'mk3-root': [
        { role: 'user', content: '请帮我审查一下当前的微服务架构方案', timestamp: '2026-04-09T14:00:00Z' },
        { role: 'assistant', content: '架构评审我会从三个视角展开：1) 安全性——鉴权、数据加密、攻击面分析；2) 可扩展性——服务拆分粒度、数据分区、弹性伸缩；3) 性能——热点路径延迟、资源瓶颈、优化空间。每个视角独立深入，最后汇总结论。请先提供架构图或核心服务列表。', timestamp: '2026-04-09T14:01:00Z' },
      ],
      'mk3-security': [
        { role: 'user', content: '安全方面有什么风险？', timestamp: '2026-04-09T14:10:00Z' },
        { role: 'assistant', content: '常见风险点：1) 服务间通信未加密——内网也要 mTLS；2) API 网关鉴权绕过——每个服务还需要独立校验 token；3) 敏感数据明文存储——密码、token 必须加密，日志脱敏；4) 依赖库漏洞——定期扫描 CVE；5) 缺乏审计日志——关键操作必须记录 who/what/when。建议用 STRIDE 模型做完整威胁建模。', timestamp: '2026-04-09T14:11:00Z' },
      ],
      'mk3-scale': [
        { role: 'user', content: '可扩展性怎么评估？', timestamp: '2026-04-09T14:20:00Z' },
        { role: 'assistant', content: '评估维度：1) 水平扩展能力——服务是否无状态？有状态的部分（session、缓存）怎么处理？2) 数据分区——单表 > 1000 万行时的分库分表策略？3) 弹性伸缩——是否配置 HPA/VPA？扩缩容延迟能否接受？4) 服务依赖深度——调用链 > 5 层就要警惕级联故障。建议画一张服务依赖图，标注每个节点的 SLA。', timestamp: '2026-04-09T14:21:00Z' },
      ],
      'mk3-perf': [
        { role: 'user', content: '性能瓶颈在哪里？', timestamp: '2026-04-09T14:30:00Z' },
        { role: 'assistant', content: '性能分析三步走：1) 先看 P99 延迟——如果 > 500ms，用链路追踪定位最慢的环节；2) 再看资源利用率——CPU > 70%、内存 > 80% 的服务需要关注；3) 最后看吞吐——QPS 接近极限时的表现。常见瓶颈：数据库慢查询、缺乏缓存、同步调用链过长、JSON 序列化开销。', timestamp: '2026-04-09T14:31:00Z' },
      ],
      'mk3-perf-opt': [
        { role: 'user', content: '有什么具体的优化方案？', timestamp: '2026-04-09T14:40:00Z' },
        { role: 'assistant', content: '结合可扩展性评估的结论，优化方案：1) 热路径缓存——接口级缓存 + Redis 二级缓存，预期延迟降 60%；2) 异步化——非关键路径改消息队列（下单→发通知、写日志），释放主线程；3) 连接池调优——DB 和 Redis 的 pool size 按并发量公式计算；4) 批量化——N+1 查询改批量拉取，减少 DB roundtrip；5) CDN——静态资源和 API 响应缓存。综合目标：P99 从 2s 降到 200ms。', timestamp: '2026-04-09T14:41:00Z' },
      ],
    },
    l2: {
      'mk3-root': '架构评审从安全性、可扩展性、性能三个视角展开审视。',
      'mk3-security': '安全风险：服务间加密、鉴权穿透、数据脱敏、依赖漏洞、审计日志。',
      'mk3-scale': '扩展性评估：无状态设计、数据分区、弹性伸缩、依赖深度控制。',
      'mk3-perf': '性能分析：P99 延迟、资源利用率、吞吐极限，定位瓶颈在 DB 和同步调用。',
      'mk3-perf-opt': '优化方案：缓存 + 异步化 + 连接池调优 + 批量化 + CDN，目标 P99 < 200ms。',
    },
  },
  'mk-4': {
    tree: [
      {
        id: 'mk4-root', label: '市场分析', status: 'active', turnCount: 2, children: [
          { id: 'mk4-product', label: '产品方案', status: 'active', turnCount: 2, sourceSessionId: 'mk4-root', children: [] },
          {
            id: 'mk4-finance', label: '财务模型', status: 'active', turnCount: 2, children: [
              { id: 'mk4-finance-rev', label: '营收预测', status: 'active', turnCount: 2, sourceSessionId: 'mk4-root', children: [] },
            ],
          },
          { id: 'mk4-team', label: '团队介绍', status: 'active', turnCount: 2, children: [] },
        ],
      },
    ],
    messages: {
      'mk4-root': [
        { role: 'user', content: '帮我分析一下 AI 教育赛道的市场机会', timestamp: '2026-04-09T11:00:00Z' },
        { role: 'assistant', content: '全球 AI 教育市场 2025 年约 $45B，CAGR 28%。三个机会点：1) 个性化学习路径——每个学生的掌握程度不同，AI 能实时调整；2) 智能题库——不只出题，还能分析薄弱点；3) 虚拟导师——7×24 在线答疑。竞品分析：Duolingo AI（语言）、Khan Academy（K12）、Coursera（高等教育），但垂直场景还有大量空白。', timestamp: '2026-04-09T11:01:00Z' },
      ],
      'mk4-product': [
        { role: 'user', content: '产品方案怎么定？', timestamp: '2026-04-09T11:10:00Z' },
        { role: 'assistant', content: '基于市场分析，产品定位：AI 驱动的个性化学习助手。核心功能：1) 知识图谱——把学科内容结构化为可导航的拓扑；2) 自适应学习——根据测评结果动态调整学习路径；3) 苏格拉底式对话——不直接给答案，通过提问引导思考。差异化：不是替代老师，而是成为每个学生的专属学习伙伴。', timestamp: '2026-04-09T11:11:00Z' },
      ],
      'mk4-finance': [
        { role: 'user', content: '财务模型怎么搭？', timestamp: '2026-04-09T11:20:00Z' },
        { role: 'assistant', content: '双重收入模型：1) To C 订阅——$15/月个人版，$8/月学生优惠，目标 Y1 获 1 万付费用户；2) To B 校园版——$5/学生/月，以学校为单位采购。成本端：LLM 调用是大头（~40% of revenue），需要精细化 prompt 控制和缓存策略来控制 API 费用。预计 Y2 达到盈亏平衡。', timestamp: '2026-04-09T11:21:00Z' },
      ],
      'mk4-finance-rev': [
        { role: 'user', content: '三年营收怎么预测？', timestamp: '2026-04-09T11:30:00Z' },
        { role: 'assistant', content: '基于市场分析数据：Y1 — To C 1 万用户 × $12 ARPU = $1.4M + To B 20 所学校 × 500 学生 × $5 = $600K，合计 $2M ARR；Y2 — 用户量 3x 增长 + To B 渠道放量 = $8M ARR；Y3 — 国际化 + 多学科扩展 = $25M ARR。关键假设：月度留存率 > 60%，获客成本 CAC < $30。', timestamp: '2026-04-09T11:31:00Z' },
      ],
      'mk4-team': [
        { role: 'user', content: '团队怎么组建？', timestamp: '2026-04-09T11:40:00Z' },
        { role: 'assistant', content: '初创团队 5 人配置：1) CEO/产品——教育行业背景 + 产品经验；2) CTO——全栈 + AI/ML 经验；3) 前端工程师——擅长交互设计；4) AI 工程师——NLP/RAG 专精；5) 教研专家——学科内容设计 + 教育学背景。前 3 个是必须的 co-founder 级别，后 2 个可以早期员工或顾问。教育赛道特别需要有真正懂教育的人。', timestamp: '2026-04-09T11:41:00Z' },
      ],
    },
    l2: {
      'mk4-root': '市场分析：AI 教育 $45B 市场，个性化学习路径是核心机会。',
      'mk4-product': '产品定位：AI 个性化学习助手，知识图谱 + 自适应 + 苏格拉底对话。',
      'mk4-finance': '双重收入：To C 订阅 + To B 校园版，LLM 调用成本需精细控制。',
      'mk4-finance-rev': '三年营收：$2M → $8M → $25M ARR，关键假设留存 > 60%。',
      'mk4-team': '5 人初创团队：CEO + CTO + 前端 + AI 工程师 + 教研专家。',
    },
  },
}

function delay(ms = 300) {
  return new Promise(r => setTimeout(r, ms))
}

const mockReplies = [
  "Interesting thought! Let me think about that...",
  "That's a great angle — what if we also consider the edge cases?",
  "I'd suggest breaking this into smaller pieces first.",
  "Hmm, have you looked at how the existing topology handles this?",
  "Let me sketch out a quick plan for that approach.",
]

let idCounter = 100

/* ─── Real API (when MOCK=false) ─── */

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

/* ─── Spaces ─── */

export async function listSpaces(): Promise<{ spaces: Space[] }> {
  if (MOCK) { await delay(); return { spaces: [...mockSpaces] } }
  return request('/spaces')
}

export async function createSpace(data: {
  label: string
  emoji?: string
  color?: string
  mode?: SpaceMode
  description?: string
  deliverables?: string[]
  systemPrompt?: string
}): Promise<{ space: Space }> {
  if (MOCK) {
    await delay()
    const now = new Date().toISOString()
    const space: Space = {
      id: `sp-${++idCounter}`,
      label: data.label,
      emoji: data.emoji || '💡',
      color: data.color || '#3a6bc5',
      mode: data.mode || 'AUTO',
      deliverables: data.deliverables || [],
      description: data.description || '',
      systemPrompt: data.systemPrompt || '',
      createdAt: now,
      lastActiveAt: now,
    }
    mockSpaces.push(space)
    mockTrees[space.id] = [{ id: `${space.id}-main`, label: '主节点', status: 'active', turnCount: 0, children: [] }]
    return { space }
  }
  return request('/spaces', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteSpace(spaceId: string): Promise<void> {
  if (MOCK) {
    await delay()
    mockSpaces = mockSpaces.filter(s => s.id !== spaceId)
    delete mockTrees[spaceId]
    return
  }
  return request(`/spaces/${spaceId}`, { method: 'DELETE' })
}

/* ─── Sessions ─── */

export async function getSessionTree(spaceId: string): Promise<{ tree: SessionTreeNode[] }> {
  if (MOCK) {
    await delay()
    return { tree: mockTrees[spaceId] || [] }
  }
  return request(`/spaces/${spaceId}/sessions`)
}

export async function sendTurn(spaceId: string, sessionId: string, _input: string): Promise<TurnResult> {
  if (MOCK) {
    await delay(800 + Math.random() * 700)
    const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)]
    let splitNote = ''
    // 随机概率创建 fork 节点来演示拓扑分裂
    if (Math.random() > 0.6) {
      const tree = mockTrees[spaceId]
      if (tree) {
        const findNode = (nodes: SessionTreeNode[], id: string): SessionTreeNode | null => {
          for (const n of nodes) {
            if (n.id === id) return n
            const found = findNode(n.children, id)
            if (found) return found
          }
          return null
        }
        const parent = findNode(tree, sessionId)
        if (parent) {
          const forkLabel = _input.slice(0, 12)
          parent.children.push({
            id: `fork-${++idCounter}`,
            label: forkLabel,
            status: 'active',
            turnCount: 0,
            children: [],
          })
          splitNote = `\n\n✦ 话题分裂：已创建新节点「${forkLabel}」，可在拓扑图中点击进入。`
        }
      }
    }
    // 随机注入跨节点洞察提示
    let insightNote = ''
    if (Math.random() > 0.75) {
      const crossInsights = [
        '⚡ 主节点发现：该讨论与其他节点的内容存在关联，建议对齐。',
        '💡 全局洞察：当前讨论的方向可以为其他节点提供支撑。',
      ]
      insightNote = '\n\n' + crossInsights[Math.floor(Math.random() * crossInsights.length)]
    }
    return { response: reply + splitNote + insightNote, records: [] }
  }
  return request(`/spaces/${spaceId}/sessions/${sessionId}/turn`, {
    method: 'POST',
    body: JSON.stringify({ input: _input }),
  })
}

export async function forkSession(spaceId: string, sessionId: string, label?: string): Promise<{ session: { id: string } }> {
  if (MOCK) {
    await delay()
    const id = `fork-${++idCounter}`
    const tree = mockTrees[spaceId]
    if (tree) {
      const findNode = (nodes: SessionTreeNode[], nid: string): SessionTreeNode | null => {
        for (const n of nodes) {
          if (n.id === nid) return n
          const found = findNode(n.children, nid)
          if (found) return found
        }
        return null
      }
      const parent = findNode(tree, sessionId)
      parent?.children.push({ id, label: label || id, status: 'active', turnCount: 0, children: [] })
    }
    return { session: { id } }
  }
  return request(`/spaces/${spaceId}/sessions/${sessionId}/fork`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  })
}

export async function getSessionMessages(_spaceId: string, sessionId: string): Promise<{ records: TurnRecord[] }> {
  if (MOCK) { await delay(); return { records: mockMessages[sessionId] ? [...mockMessages[sessionId]] : [] } }
  return request(`/spaces/${_spaceId}/sessions/${sessionId}/messages`)
}

export async function getSessionL2(_spaceId: string, sessionId: string): Promise<{ content: string | null }> {
  if (MOCK) { await delay(100); return { content: mockL2[sessionId] ?? null } }
  return request(`/spaces/${_spaceId}/sessions/${sessionId}/memory`)
}

/* ─── Market ─── */

const mockMarketKits: MarketKit[] = [
  { id: 'mk-1', label: '黑客松产品规划', description: '48h 极限开发：从 idea 到 PRD，自动分裂出产品定位、用户画像、技术方案、作战计划四条线', author: 'MindKit 官方', forks: 128, tags: ['AUTO', '产品'] },
  { id: 'mk-2', label: '留学申请规划', description: '7 个预设节点覆盖申请全流程：背景评估→选校→文书→推荐信→面试→提交→签证', author: 'edu_planner', forks: 256, tags: ['AUTO', '教育'] },
  { id: 'mk-3', label: '代码架构评审', description: '多视角审视架构决策：安全性、可扩展性、性能，自动拆分微服务/基础设施/优化三条线', author: 'techlead42', forks: 89, tags: ['PRO', '工程'] },
  { id: 'mk-4', label: '创业 BP 生成器', description: '市场分析→产品方案→财务模型→团队介绍，四条线并行探索，自动汇聚成完整 BP', author: 'founder_ai', forks: 67, tags: ['AUTO', '商业'] },
]

let mockPublished: PublishedKit[] = [
  { id: 'pub-1', spaceId: 'sp-1', label: 'AI 产品头脑风暴', description: '多线程探索 AI 产品的 UX、后端、AI 能力', tags: ['AUTO', '产品'], forks: 12, publishedAt: '2026-04-07T12:00:00Z' },
]

export async function listMarketKits(): Promise<{ kits: MarketKit[] }> {
  if (MOCK) { await delay(); return { kits: [...mockMarketKits] } }
  return request('/market')
}

/** 深拷贝树并生成新 ID，同时映射消息。模板模式下根节点 activated，其余 inactive */
function clonePreset(preset: KitPreset, prefix: string, isTemplate = true): { tree: SessionTreeNode[], messages: Record<string, TurnRecord[]>, l2: Record<string, string> } {
  const idMap: Record<string, string> = {}
  let seq = 0
  let isFirst = true
  function cloneNode(node: SessionTreeNode): SessionTreeNode {
    const newId = `${prefix}-${seq++}`
    idMap[node.id] = newId
    const isRoot = isFirst
    isFirst = false
    return {
      ...node,
      id: newId,
      sourceSessionId: node.sourceSessionId ? idMap[node.sourceSessionId] : undefined,
      activationStatus: isTemplate ? (isRoot ? 'activated' : 'inactive') : undefined,
      guideQuestion: isTemplate && !isRoot ? `描述一下你在"${node.label}"方面的想法和需求` : undefined,
      children: node.children.map(cloneNode),
    }
  }
  const tree = preset.tree.map(cloneNode)
  const messages: Record<string, TurnRecord[]> = {}
  const l2: Record<string, string> = {}
  for (const [oldId, msgs] of Object.entries(preset.messages)) {
    const newId = idMap[oldId]
    if (newId) messages[newId] = msgs.map(m => ({ ...m }))
  }
  for (const [oldId, content] of Object.entries(preset.l2)) {
    const newId = idMap[oldId]
    if (newId) l2[newId] = content
  }
  return { tree, messages, l2 }
}

export async function forkMarketKit(kitId: string, label?: string): Promise<{ space: Space }> {
  if (MOCK) {
    await delay(500)
    const kit = mockMarketKits.find(k => k.id === kitId)
    if (kit) kit.forks++
    const now = new Date().toISOString()
    const space: Space = {
      id: `sp-${++idCounter}`,
      label: label || kit?.label || 'Forked Kit',
      emoji: '📦',
      color: '#7E57C2',
      mode: (kit?.tags[0] as SpaceMode) || 'AUTO',
      deliverables: [],
      description: kit?.description || '',
      systemPrompt: '',
      createdAt: now,
      lastActiveAt: now,
      sourceKitId: kitId,
    }
    mockSpaces.push(space)

    // 复制预设拓扑和对话数据
    const preset = marketPresets[kitId]
    if (preset) {
      const cloned = clonePreset(preset, space.id)
      mockTrees[space.id] = cloned.tree
      Object.assign(mockMessages, cloned.messages)
      Object.assign(mockL2, cloned.l2)
    } else {
      mockTrees[space.id] = [{ id: `${space.id}-main`, label: 'main', status: 'active', turnCount: 0, children: [] }]
    }
    return { space }
  }
  return request(`/market/${kitId}/fork`, { method: 'POST', body: JSON.stringify({ label }) })
}

/* ─── Workshop ─── */

export async function listPublished(): Promise<{ kits: PublishedKit[] }> {
  if (MOCK) { await delay(); return { kits: [...mockPublished] } }
  return request('/workshop')
}

export async function publishSpace(spaceId: string, data: { label: string; description: string; tags: string[] }): Promise<{ kit: PublishedKit }> {
  if (MOCK) {
    await delay(500)
    const kit: PublishedKit = {
      id: `pub-${++idCounter}`,
      spaceId,
      label: data.label,
      description: data.description,
      tags: data.tags,
      forks: 0,
      publishedAt: new Date().toISOString(),
    }
    mockPublished.push(kit)
    return { kit }
  }
  return request(`/workshop/publish`, { method: 'POST', body: JSON.stringify({ spaceId, ...data }) })
}

/* ─── Products ─── */

const mockProducts: Record<string, Product[]> = {
  'sp-1': [
    { id: 'prod-1', type: 'PRD 文档', title: 'MindKit 产品需求文档 v0.1', summary: '基于多线程 AI 对话的思维协作工具，核心功能包括 Session Tree、拓扑可视化、跨节点意识', sourceNodeIds: ['s1-main', 's1-ux', 's1-backend'], content: '# MindKit PRD\n\n## 产品定位\nAI Native 思维协作工具...\n\n## 核心功能\n1. Session Tree 对话拓扑\n2. 多线程并行探索\n3. L1/L2/L3 三层记忆\n\n## 用户画像\n独立开发者和小团队 CTO', createdAt: '2026-04-08T12:00:00Z', updatedAt: '2026-04-09T10:00:00Z' },
    { id: 'prod-2', type: '技术方案', title: '技术架构设计文档', summary: 'Hono + WS 后端架构，文件系统持久化，Stello SDK 集成方案', sourceNodeIds: ['s1-backend', 's1-db', 's1-api'], content: '# 技术架构\n\n## 后端\nHono + WebSocket\n\n## 存储\n文件系统持久化\n\n## AI\nStello SDK + RAG', createdAt: '2026-04-09T08:00:00Z', updatedAt: '2026-04-09T14:00:00Z' },
  ],
  'sp-2': [
    { id: 'prod-3', type: '架构评审报告', title: '微服务化改造评审报告', summary: '从单体到微服务的改造方案，涵盖服务拆分、基础设施、性能优化三大方向', sourceNodeIds: ['s2-main', 's2-micro', 's2-infra'], content: '# 架构评审报告\n\n## 现状分析\n单体架构瓶颈...\n\n## 改造方案\n按 DDD 边界拆分...', createdAt: '2026-04-07T16:00:00Z', updatedAt: '2026-04-09T09:00:00Z' },
  ],
  'sp-3': [
    { id: 'prod-4', type: '商业计划书', title: 'MindKit 商业计划书', summary: 'AI 协作工具赛道，TAM $120B，天使轮融资 $800K，Y2 盈亏平衡', sourceNodeIds: ['s3-main', 's3-market', 's3-finance'], content: '# MindKit BP\n\n## 市场机会\nTAM $120B\n\n## 产品方案\n多线程思维协作\n\n## 财务预测\nY1 ARR $600K', createdAt: '2026-04-06T14:00:00Z', updatedAt: '2026-04-08T16:00:00Z' },
    { id: 'prod-5', type: '财务模型', title: '三年财务预测模型', summary: 'Y1-Y3 营收预测、成本结构、盈亏平衡分析', sourceNodeIds: ['s3-finance', 's3-finance-rev', 's3-finance-cost'], content: '# 财务模型\n\n## Y1\nARR $600K\n\n## Y2\nARR $3.6M\n\n## Y3\nARR $12M', createdAt: '2026-04-08T12:00:00Z', updatedAt: '2026-04-08T17:00:00Z' },
  ],
}

export async function getProducts(spaceId: string): Promise<{ products: Product[] }> {
  if (MOCK) { await delay(); return { products: mockProducts[spaceId] || [] } }
  return request(`/spaces/${spaceId}/products`)
}

/* ─── Events ─── */

const mockEvents: Record<string, SpaceEvent[]> = {
  'sp-1': [
    { id: 'evt-1', type: 'node_created', description: '创建核心构思节点，开始产品方向探索', nodeId: 's1-main', timestamp: '2026-04-08T09:00:00Z' },
    { id: 'evt-2', type: 'node_created', description: '话题分裂：从核心构思中拆分出 UX 设计线', nodeId: 's1-ux', timestamp: '2026-04-08T09:10:00Z' },
    { id: 'evt-3', type: 'node_created', description: '话题分裂：从核心构思中拆分出后端架构线', nodeId: 's1-backend', timestamp: '2026-04-08T09:20:00Z' },
    { id: 'evt-4', type: 'l2_updated', description: 'UX 设计节点摘要更新：确定手绘涂鸦风格方案', nodeId: 's1-ux', timestamp: '2026-04-08T09:15:00Z' },
    { id: 'evt-5', type: 'cross_node_link', description: '发现关联：后端架构引用了 UX 线的接口需求', nodeId: 's1-backend', relatedNodeIds: ['s1-ux'], timestamp: '2026-04-08T09:25:00Z' },
    { id: 'evt-6', type: 'node_created', description: '话题分裂：从核心构思中拆分出 AI 能力线', nodeId: 's1-ai', timestamp: '2026-04-08T11:00:00Z' },
    { id: 'evt-7', type: 'insight_generated', description: '全局洞察：UX 的移动端方案需要 API 做字段裁剪适配', nodeId: 's1-main', relatedNodeIds: ['s1-ux-mobile', 's1-api'], timestamp: '2026-04-08T10:15:00Z' },
    { id: 'evt-8', type: 'product_created', description: '产物生成：MindKit 产品需求文档 v0.1', nodeId: 's1-main', timestamp: '2026-04-08T12:00:00Z' },
    { id: 'evt-9', type: 'cross_node_link', description: '发现关联：RAG 检索方案依赖数据模型的 embedding 设计', nodeId: 's1-ai-rag', relatedNodeIds: ['s1-db'], timestamp: '2026-04-08T11:15:00Z' },
    { id: 'evt-10', type: 'product_created', description: '产物生成：技术架构设计文档', nodeId: 's1-backend', timestamp: '2026-04-09T08:00:00Z' },
    { id: 'evt-11', type: 'product_updated', description: '产物更新：PRD 补充了 AI 能力章节', nodeId: 's1-ai', timestamp: '2026-04-09T10:00:00Z' },
    { id: 'evt-12', type: 'insight_generated', description: '全局洞察：Agent 编排框架可复用 RAG 的检索能力', nodeId: 's1-main', relatedNodeIds: ['s1-ai-agent', 's1-ai-rag'], timestamp: '2026-04-09T11:00:00Z' },
  ],
  'sp-2': [
    { id: 'evt-20', type: 'node_created', description: '创建架构总览节点', nodeId: 's2-main', timestamp: '2026-04-07T14:00:00Z' },
    { id: 'evt-21', type: 'node_created', description: '话题分裂：微服务拆分策略', nodeId: 's2-micro', timestamp: '2026-04-07T14:10:00Z' },
    { id: 'evt-22', type: 'node_created', description: '话题分裂：基础设施规划', nodeId: 's2-infra', timestamp: '2026-04-07T14:50:00Z' },
    { id: 'evt-23', type: 'cross_node_link', description: '发现关联：CI/CD 需引用微服务拆分的构建单元', nodeId: 's2-infra-ci', relatedNodeIds: ['s2-micro'], timestamp: '2026-04-07T15:12:00Z' },
    { id: 'evt-24', type: 'insight_generated', description: '全局洞察：性能优化应优先做缓存层，异步化依赖消息队列就绪', nodeId: 's2-main', relatedNodeIds: ['s2-perf', 's2-micro-mq'], timestamp: '2026-04-07T15:25:00Z' },
    { id: 'evt-25', type: 'product_created', description: '产物生成：微服务化改造评审报告', nodeId: 's2-main', timestamp: '2026-04-07T16:00:00Z' },
  ],
  'sp-3': [
    { id: 'evt-30', type: 'node_created', description: '创建 BP 大纲节点', nodeId: 's3-main', timestamp: '2026-04-06T10:00:00Z' },
    { id: 'evt-31', type: 'node_created', description: '话题分裂：市场分析', nodeId: 's3-market', timestamp: '2026-04-06T10:10:00Z' },
    { id: 'evt-32', type: 'cross_node_link', description: '发现关联：产品方案引用了市场分析的用户画像结论', nodeId: 's3-product', relatedNodeIds: ['s3-market'], timestamp: '2026-04-06T10:45:00Z' },
    { id: 'evt-33', type: 'insight_generated', description: '全局洞察：TAM 数据已具备生成营收预测的条件', nodeId: 's3-main', relatedNodeIds: ['s3-market-tam', 's3-finance-rev'], timestamp: '2026-04-06T11:25:00Z' },
    { id: 'evt-34', type: 'product_created', description: '产物生成：MindKit 商业计划书', nodeId: 's3-main', timestamp: '2026-04-06T14:00:00Z' },
    { id: 'evt-35', type: 'product_updated', description: '产物更新：BP 补充了财务模型章节', nodeId: 's3-finance', timestamp: '2026-04-08T16:00:00Z' },
  ],
}

export async function getEvents(spaceId: string): Promise<{ events: SpaceEvent[] }> {
  if (MOCK) { await delay(); return { events: mockEvents[spaceId] || [] } }
  return request(`/spaces/${spaceId}/events`)
}

/* ─── Insights ─── */

const mockInsights: Record<string, Insight[]> = {
  'sp-1': [
    { id: 'ins-1', content: 'UX 的移动端适配方案与 API 设计需要对齐——移动端需要字段裁剪和分页，建议 API 层统一处理', sourceNodeIds: ['s1-ux-mobile', 's1-api'], sourceLabels: ['移动端适配', 'API 设计'], timestamp: '2026-04-08T10:15:00Z' },
    { id: 'ins-2', content: 'RAG 检索的 embedding 方案直接依赖数据模型设计，建议两条线对齐 chunk 粒度和索引策略', sourceNodeIds: ['s1-ai-rag', 's1-db'], sourceLabels: ['RAG 检索', '数据模型'], timestamp: '2026-04-08T11:15:00Z' },
    { id: 'ins-3', content: 'Agent 编排可复用 RAG 的向量检索能力作为内置工具，避免重复开发', sourceNodeIds: ['s1-ai-agent', 's1-ai-rag'], sourceLabels: ['Agent 编排', 'RAG 检索'], timestamp: '2026-04-09T11:00:00Z' },
  ],
  'sp-2': [
    { id: 'ins-4', content: '性能优化的缓存层设计需要等消息队列选型确定后再展开，因为缓存失效策略依赖事件驱动', sourceNodeIds: ['s2-perf-cache', 's2-micro-mq'], sourceLabels: ['缓存策略', '消息队列'], timestamp: '2026-04-07T15:25:00Z' },
    { id: 'ins-5', content: 'CI/CD 流水线的构建单元需要跟随微服务拆分粒度，建议同步推进', sourceNodeIds: ['s2-infra-ci', 's2-micro'], sourceLabels: ['CI/CD 流水线', '微服务拆分'], timestamp: '2026-04-07T15:12:00Z' },
  ],
  'sp-3': [
    { id: 'ins-6', content: 'TAM 测算数据已完成，营收预测模型可以开始搭建', sourceNodeIds: ['s3-market-tam', 's3-finance-rev'], sourceLabels: ['TAM 测算', '营收预测'], timestamp: '2026-04-06T11:25:00Z' },
    { id: 'ins-7', content: '产品方案中的用户价值描述与市场分析中的客群画像高度一致，叙事逻辑自洽', sourceNodeIds: ['s3-product', 's3-market'], sourceLabels: ['产品方案', '市场分析'], timestamp: '2026-04-06T10:45:00Z' },
  ],
}

export async function getInsights(spaceId: string): Promise<{ insights: Insight[] }> {
  if (MOCK) { await delay(); return { insights: mockInsights[spaceId] || [] } }
  return request(`/spaces/${spaceId}/insights`)
}

/* ─── Space Settings ─── */

export async function updateSpace(spaceId: string, data: Partial<Pick<Space, 'label' | 'emoji' | 'color' | 'mode' | 'deliverables' | 'description' | 'systemPrompt'>>): Promise<{ space: Space }> {
  if (MOCK) {
    await delay()
    const space = mockSpaces.find(s => s.id === spaceId)
    if (!space) throw new Error('Space not found')
    Object.assign(space, data)
    return { space: { ...space } }
  }
  return request(`/spaces/${spaceId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

/* ─── WebSocket (mock 下不连接) ─── */

export function connectWs(onMessage: (data: unknown) => void): WebSocket | null {
  if (MOCK) return null
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${location.host}/ws`)
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch { /* ignore */ }
  }
  return ws
}
