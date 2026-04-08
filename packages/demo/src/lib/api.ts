/** MindKit API 客户端 — mock 模式（后端未就绪时使用内存数据） */

const MOCK = true

/* ─── Types ─── */

export interface Space {
  id: string
  label: string
  description: string
  systemPrompt: string
  createdAt: string
}

export interface SessionTreeNode {
  id: string
  label: string
  sourceSessionId?: string
  status: 'active' | 'archived'
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
  { id: 'sp-1', label: 'AI 产品头脑风暴', description: '围绕 AI Native 产品方向展开发散讨论，涵盖用户画像、核心场景和 MVP 功能定义', systemPrompt: '', createdAt: '2026-04-08T00:00:00Z' },
  { id: 'sp-2', label: '技术架构评审', description: '对微服务拆分方案进行多角度评审，重点关注性能瓶颈、可扩展性和部署策略', systemPrompt: '', createdAt: '2026-04-07T00:00:00Z' },
  { id: 'sp-3', label: '创业 BP 撰写', description: '从市场分析到财务模型，逐步推演完整商业计划书，聚焦投资人关注的关键指标', systemPrompt: '', createdAt: '2026-04-06T00:00:00Z' },
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
  // Space 1
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
  's1-ai-rag': [
    { role: 'user', content: 'RAG 怎么和 session tree 结合？', timestamp: '2026-04-08T11:00:00Z' },
    { role: 'assistant', content: '每个 Session 的对话内容做 embedding 存入向量库。当用户在某个节点提问时，不仅检索当前节点历史，还检索整棵树的相关片段——这就是跨节点的 L1 意识。检索结果带上来源节点 ID，AI 可以主动建议"这和 design 节点的讨论相关"。', timestamp: '2026-04-08T11:01:00Z' },
  ],
  // Space 2
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
  's2-infra-k8s': [
    { role: 'user', content: 'K8s 集群怎么规划节点？', timestamp: '2026-04-07T15:00:00Z' },
    { role: 'assistant', content: '建议三层节点池：1) 系统节点池（3 节点）——运行 ingress、监控、日志；2) 应用节点池（可伸缩）——运行业务服务，配 HPA 自动扩缩；3) 计算节点池（按需）——跑批处理和 AI 推理任务。存储用 CSI 接云盘。', timestamp: '2026-04-07T15:01:00Z' },
  ],
  's2-perf-cache': [
    { role: 'user', content: '缓存穿透怎么防？', timestamp: '2026-04-07T15:30:00Z' },
    { role: 'assistant', content: '三板斧：1) 布隆过滤器——请求到达前先判断 key 是否可能存在；2) 空值缓存——查不到也缓存一个短 TTL 的空值；3) 热点 key 发现——监控 QPS 最高的 key，主动预热。另外缓存雪崩用随机 TTL + 互斥锁防范。', timestamp: '2026-04-07T15:31:00Z' },
  ],
  // Space 3
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
  's3-product-mvp': [
    { role: 'user', content: 'MVP 应该包含哪些功能？', timestamp: '2026-04-06T11:00:00Z' },
    { role: 'assistant', content: 'MVP 三个核心功能：1) Space 创建和管理——用户能创建多个思维空间；2) 对话拓扑——可视化 session tree，支持分叉和节点切换；3) AI 多线程对话——每个节点独立对话，AI 有跨节点感知。砍掉：协作、Market、离线模式。目标：2 周开发，验证"拓扑思维"的核心假设。', timestamp: '2026-04-06T11:01:00Z' },
  ],
  's3-finance-rev': [
    { role: 'user', content: '营收模型怎么算？', timestamp: '2026-04-06T11:30:00Z' },
    { role: 'assistant', content: '基于 TAM 节点的数据，三年预测：Y1 — 免费增值获客 5000 付费用户 × $10/月 = $600K ARR；Y2 — 增加团队版 $30/月，目标 2 万用户 = $3.6M ARR；Y3 — 企业版 + Market 分成，目标 $12M ARR。毛利率预估 75%（主要成本是 LLM API 调用）。', timestamp: '2026-04-06T11:31:00Z' },
  ],
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

export async function createSpace(data: { label: string; systemPrompt?: string }): Promise<{ space: Space }> {
  if (MOCK) {
    await delay()
    const space: Space = {
      id: `sp-${++idCounter}`,
      label: data.label,
      description: '',
      systemPrompt: data.systemPrompt || '',
      createdAt: new Date().toISOString(),
    }
    mockSpaces.push(space)
    mockTrees[space.id] = [{ id: 'main', label: 'main', status: 'active', turnCount: 0, children: [] }]
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
          parent.children.push({
            id: `fork-${++idCounter}`,
            label: _input.slice(0, 12),
            status: 'active',
            turnCount: 0,
            children: [],
          })
        }
      }
    }
    return { response: reply, records: [] }
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

export async function forkMarketKit(kitId: string, label?: string): Promise<{ space: Space }> {
  if (MOCK) {
    await delay(500)
    const kit = mockMarketKits.find(k => k.id === kitId)
    if (kit) kit.forks++
    const space: Space = {
      id: `sp-${++idCounter}`,
      label: label || kit?.label || 'Forked Kit',
      description: kit?.description || '',
      systemPrompt: '',
      createdAt: new Date().toISOString(),
    }
    mockSpaces.push(space)
    mockTrees[space.id] = [{ id: 'main', label: 'main', status: 'active', turnCount: 0, children: [] }]
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
