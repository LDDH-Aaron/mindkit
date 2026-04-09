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
  /** 跨分支关联（蓝色虚线） */
  sourceSessionId?: string
  /** 跨分支矛盾（红色虚线） */
  conflictSessionId?: string
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
  /** 系统级通知（关联/矛盾发现等），作为单独消息展示 */
  systemNotices?: string[]
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
  // ── Space 1: AI 产品头脑风暴（演示用，初始只有根节点，对话后逐步生长）──
  'sp-1': [
    {
      id: 's1-main', label: 'MindKit', status: 'active', turnCount: 1, children: [],
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
          id: 's2-perf', label: '性能优化', status: 'active', turnCount: 2, sourceSessionId: 's2-micro-mq', conflictSessionId: 's2-micro', children: [
            { id: 's2-perf-cache', label: '缓存策略', status: 'active', turnCount: 1, children: [] },
            { id: 's2-perf-db', label: 'DB 调优', status: 'active', turnCount: 1, conflictSessionId: 's2-infra-k8s', children: [] },
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
  's1-main': 'MindKit 总览：用 AI 驱动的思维拓扑工具规划自身的商业化落地，涵盖产品定位、核心功能、技术架构、商业化和落地计划五条主线。',
  's1-pos': '产品定位确定为"AI-native thinking partner"，核心差异化在于动态拓扑 + AI 驱动分裂，面向独立开发者和小团队负责人。',
  's1-user': '目标用户聚焦独立开发者：25-35 岁全栈工程师，月付费意愿 $15-25，核心痛点是多角色切换时思维碎片化。',
  's1-comp': '竞品包括 ChatGPT（线性对话）、Notion AI（文档嵌入）、Miro（可视化画布）、Cursor（代码场景），均缺少动态拓扑 + AI 分裂能力。',
  's1-diff': '差异化定位："AI-driven thinking topology"——唯一同时具备对话拓扑、AI 自动分裂、跨节点洞察的产品，数据护城河来自用户积累的思维模式。',
  's1-feat': '核心功能优先级排序：对话拓扑引擎 > AI 自动分裂 > 跨节点洞察，交互模型为 Chat + Canvas 双面板。',
  's1-topo': '对话拓扑引擎基于 Session Tree 实现，Canvas 渲染 + 力导向布局，支持懒加载和视口裁剪以保证大规模节点下的性能。',
  's1-split': 'AI 自动分裂通过 LLM 检测话题漂移触发，置信度阈值 > 0.7 时建议分裂，与拓扑引擎深度耦合需同步迭代。',
  's1-insight': '跨节点洞察通过 L1/L2/L3 三层记忆架构实现：L3 原始对话 → L2 节点摘要 → L1 全局语义比对，自动发现关联和矛盾。',
  's1-arch': '技术架构选型 TypeScript + pnpm monorepo + Hono 后端，核心约束是本地优先，存在本地 vs 云端的长期张力。',
  's1-local': '本地优先存储采用文件系统持久化方案，优势是零依赖和可 git 管理，但与未来云端同步功能存在架构矛盾。',
  's1-llm': 'LLM 接入层采用 provider-agnostic 抽象，支持 Claude/GPT/本地模型切换，通过 token 预算控制每节点调用成本。',
  's1-deploy': '部署方案采用 local-first + optional cloud sync 的 hybrid 路径，在本地存储原则和云端同步需求之间取得平衡。',
  's1-biz': '商业化路径以独立开发者为起点，先通过免费版验证核心价值，再导入 Pro/Team 付费层级，采用 open-core 模式。',
  's1-price': '定价策略 Free/Pro/Team 三档：免费版限 3 Space + 50 节点 + 基础模型，Pro $19/月，Team $39/人/月。',
  's1-oss': '开源社区采用 open-core 模式：核心拓扑引擎开源获取分发优势，高级洞察和团队协作功能作为付费闭源模块。',
  's1-growth': '增长飞轮：开源社区 → 模板分享（Market）→ 用户沉淀思维数据 → 网络效应，关键留存靠积累的思维拓扑不可迁移。',
  's1-mvp': '极简 MVP 范围：单 Space + 基础拓扑 + 手动分裂 + 单模型，砍掉 Market、跨节点洞察和多模型，4 周冲刺完成核心循环。',
  's1-plan': '落地计划分三阶段：4 周 MVP → 8 周 beta（加入 Market 和洞察）→ 正式上线，最小团队 3 人。',
  's1-roadmap': '上线路线图：W1-4 MVP → W5-8 内测 → W9 ProductHunt + HackerNews launch，成功指标 DAU 500 / 日均 Space 创建 50 / 7 日留存 40%。',
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
  // ── Space 1: AI 产品头脑风暴（MindKit 商业化落地规划）──
  's1-main': [
    { role: 'user', content: '我想用 MindKit 来规划 MindKit 自己的商业化落地，算是 dogfooding 了', timestamp: '2026-04-09T09:00:00Z' },
    { role: 'assistant', content: '这是最好的验证方式！用自己的产品规划自己的未来。MindKit 的核心概念是"思维拓扑"——让 AI 对话不再是线性的问答，而是可以分裂、关联、发现矛盾的树状结构。', timestamp: '2026-04-09T09:01:00Z' },
    { role: 'user', content: '思维拓扑和思维导图有什么本质区别？', timestamp: '2026-04-09T09:02:00Z' },
    { role: 'assistant', content: '思维导图是静态的、人工组织的；而 MindKit 的拓扑是动态的、AI 驱动的。每个节点都是一段活的对话，AI 能自动检测话题漂移并建议分裂，还能跨节点发现关联和矛盾。这不是画图工具，是思考伙伴。', timestamp: '2026-04-09T09:03:00Z' },
    { role: 'user', content: '那这个东西商业化潜力大吗？谁会为此付费？', timestamp: '2026-04-09T09:04:00Z' },
    { role: 'assistant', content: '独立开发者和小团队负责人最有痛感——他们一个人要兼顾产品、技术、运营多个角色，思维极易碎片化。建议我们分五条主线并行探索：产品定位、核心功能、技术架构、商业化路径、落地计划。', timestamp: '2026-04-09T09:05:00Z' },
  ],
  's1-pos': [
    { role: 'user', content: '先把 MindKit 的产品定位想清楚，到底面向谁、解决什么问题', timestamp: '2026-04-09T09:10:00Z' },
    { role: 'assistant', content: '定位建议是"AI-native thinking partner"——不是另一个聊天机器人，而是能陪你深度思考的伙伴。核心差异在于结构化：你的思考会自然生长成一棵树，而不是淹没在一长串对话里。', timestamp: '2026-04-09T09:11:00Z' },
    { role: 'user', content: '但别人会不会觉得这不就是 ChatGPT 加个思维导图？', timestamp: '2026-04-09T09:12:00Z' },
    { role: 'assistant', content: '关键区别在于"活"的拓扑。ChatGPT 的对话是线性的、用完即弃的；我们的每个节点都有持续的上下文，AI 能跨节点感知全局，自动发现"你在 A 节点说的和 B 节点矛盾了"。这是认知工具，不是问答工具。', timestamp: '2026-04-09T09:13:00Z' },
    { role: 'user', content: '那一句话总结价值主张是什么？', timestamp: '2026-04-09T09:14:00Z' },
    { role: 'assistant', content: '"让你的思考像树一样生长，而不是像水一样流走。" 具体来说：结构化保留思考过程，AI 主动发现盲点和矛盾，随着使用积累越来越懂你的思维模式。', timestamp: '2026-04-09T09:15:00Z' },
  ],
  's1-user': [
    { role: 'user', content: '目标用户到底是谁？不能太泛', timestamp: '2026-04-09T09:30:00Z' },
    { role: 'assistant', content: '建议聚焦三个人群：1) 独立开发者——一个人扛产品/技术/运营，思维碎片化严重；2) 小团队负责人——需要理清多条并行决策线；3) AI 研究者——需要结构化记录实验思路和发现。', timestamp: '2026-04-09T09:31:00Z' },
    { role: 'user', content: '独立开发者的痛点具体是什么？', timestamp: '2026-04-09T09:32:00Z' },
    { role: 'assistant', content: '核心痛点是"多角色切换成本"。一个人既是 PM 又是工程师又是设计师，每次切换角色都要重新加载上下文。现有工具要么太重（Notion、Confluence），要么太碎（微信收藏、备忘录），没有一个工具能让思维有序地展开。', timestamp: '2026-04-09T09:33:00Z' },
    { role: 'user', content: '小团队呢？他们不是应该用协作工具吗', timestamp: '2026-04-09T09:34:00Z' },
    { role: 'assistant', content: '小团队（2-5 人）其实很尴尬——协作工具太重用不起来，但个人工具又没法共享决策过程。不过这里有个张力：本地优先和协作天然矛盾。建议 MVP 先聚焦个人场景。', timestamp: '2026-04-09T09:35:00Z' },
    { role: 'user', content: '好，先打独立开发者这个群体', timestamp: '2026-04-09T09:36:00Z' },
    { role: 'assistant', content: '明智的选择。独立开发者画像：25-35 岁，全栈工程师为主，习惯为工具付费（GitHub Copilot、Cursor 等已经教育过市场），月付费意愿在 $15-25 区间。他们在 Twitter/X、IndieHackers、ProductHunt 上非常活跃，口碑传播快。', timestamp: '2026-04-09T09:37:00Z' },
  ],
  's1-comp': [
    { role: 'user', content: '市面上有什么竞品？直接和间接的都算', timestamp: '2026-04-09T10:00:00Z' },
    { role: 'assistant', content: '四大类竞品：1) ChatGPT/Claude——深度对话但完全线性，无法结构化；2) Notion AI——文档内嵌 AI，但不是对话驱动的思考工具；3) Miro/Whimsical——可视化画布，但缺乏 AI 深度交互；4) Cursor——代码场景的 AI 工具，证明了开发者愿意为 AI 工具付费。', timestamp: '2026-04-09T10:01:00Z' },
    { role: 'user', content: '为什么这些工具都不够好？', timestamp: '2026-04-09T10:02:00Z' },
    { role: 'assistant', content: '没有一个同时具备三个能力：1) 动态拓扑——对话自然生长成树结构；2) AI 驱动分裂——自动检测话题漂移并建议分叉；3) 跨节点智能——在节点之间发现关联和矛盾。这三个能力的组合就是我们的护城河。', timestamp: '2026-04-09T10:03:00Z' },
    { role: 'user', content: '那价格上呢？竞品怎么收费的', timestamp: '2026-04-09T10:04:00Z' },
    { role: 'assistant', content: '价格参考：ChatGPT Plus $20/月，Cursor Pro $20/月，Notion AI $10/人/月附加，Miro $8-16/人/月。开发者群体对 $15-25/月的工具接受度很高，关键是要让他们感受到"不可替代的价值"。', timestamp: '2026-04-09T10:05:00Z' },
  ],
  's1-diff': [
    { role: 'user', content: '基于竞品分析，我们的差异化到底在哪', timestamp: '2026-04-09T10:20:00Z' },
    { role: 'assistant', content: '结合竞品分析的发现，差异化定位可以总结为一句话："AI-driven thinking topology"——我们是唯一一个让 AI 对话自动生长成可探索拓扑的工具。', timestamp: '2026-04-09T10:21:00Z' },
    { role: 'user', content: '但这个概念对用户来说会不会太抽象？', timestamp: '2026-04-09T10:22:00Z' },
    { role: 'assistant', content: '好问题。用户看到的不是"拓扑"，而是"我的想法终于不再乱糟糟了"。演示 demo 的第一感受应该是：输入一个模糊问题，AI 帮你拆解成多条探索线，每条线独立深入，最后自动发现交叉和矛盾——就像现在我们在做的这件事。', timestamp: '2026-04-09T10:23:00Z' },
    { role: 'user', content: '护城河够深吗？别人能不能抄', timestamp: '2026-04-09T10:24:00Z' },
    { role: 'assistant', content: '技术本身可以被复制，但数据护城河很深。用户在 MindKit 里积累的思维拓扑、决策过程、知识网络是高度个人化的，迁移成本极高。用得越久，AI 越懂你的思维模式——这是经典的飞轮效应。', timestamp: '2026-04-09T10:25:00Z' },
  ],
  's1-feat': [
    { role: 'user', content: '核心功能都有哪些？先列个全景图', timestamp: '2026-04-09T09:20:00Z' },
    { role: 'assistant', content: '核心功能三层：1) 对话拓扑引擎——session tree 的创建、渲染、交互；2) AI 自动分裂——检测话题漂移并建议分叉新节点；3) 跨节点洞察——在节点之间发现关联、矛盾和总结。外围功能：Market 模板、产物生成、Space 管理。', timestamp: '2026-04-09T09:21:00Z' },
    { role: 'user', content: '优先级怎么排？不可能全做', timestamp: '2026-04-09T09:22:00Z' },
    { role: 'assistant', content: '建议：拓扑引擎是地基必须先做，自动分裂是核心体验必须紧跟，跨节点洞察是差异化卖点但可以简化版本先上。Market 和产物生成属于锦上添花，MVP 阶段可以砍掉。', timestamp: '2026-04-09T09:23:00Z' },
    { role: 'user', content: '交互上怎么呈现？', timestamp: '2026-04-09T09:24:00Z' },
    { role: 'assistant', content: '核心交互是 Chat + Canvas 双面板：左侧是拓扑画布，展示整棵思维树；右侧是对话面板，在选中的节点上深入交谈。点击节点切换对话上下文，AI 回复时可能建议"这个话题值得单独展开"。', timestamp: '2026-04-09T09:25:00Z' },
  ],
  's1-topo': [
    { role: 'user', content: '对话拓扑引擎怎么设计？这是最底层的能力', timestamp: '2026-04-09T10:30:00Z' },
    { role: 'assistant', content: '核心是 Session Tree 数据结构：每个节点是一个独立会话（有自己的消息列表和上下文），节点之间有 parent-child 关系和 source/conflict 跨分支引用。前端用 Canvas 渲染，后端用文件系统持久化。', timestamp: '2026-04-09T10:31:00Z' },
    { role: 'user', content: '布局算法用什么？节点多了不会乱吗', timestamp: '2026-04-09T10:32:00Z' },
    { role: 'assistant', content: '推荐分层布局（Sugiyama 算法变体）作为基础，叠加力导向微调处理跨分支连线。节点按深度分层、同层按宽度排列，source/conflict 连线用贝塞尔曲线避免遮挡。', timestamp: '2026-04-09T10:33:00Z' },
    { role: 'user', content: '实时渲染性能够吗？节点可能有几十上百个', timestamp: '2026-04-09T10:34:00Z' },
    { role: 'assistant', content: 'Canvas 2D 渲染几百个节点完全没问题。关键优化两点：1) 视口裁剪——只渲染可见区域内的节点；2) 懒加载——深层子树折叠后不渲染。实测 200 节点在低端设备上也能 60fps。', timestamp: '2026-04-09T10:35:00Z' },
  ],
  's1-split': [
    { role: 'user', content: '自动分裂具体怎么实现？什么时候触发', timestamp: '2026-04-09T10:50:00Z' },
    { role: 'assistant', content: '基于拓扑引擎的节点结构，自动分裂的核心逻辑是：用 LLM 分析每轮对话，检测是否出现了与当前节点主题显著偏离的新话题。当置信度 > 0.7 时，AI 会建议"这个话题值得分裂出一个新节点"。', timestamp: '2026-04-09T10:51:00Z' },
    { role: 'user', content: '误判怎么办？总不能动不动就弹窗说要分裂', timestamp: '2026-04-09T10:52:00Z' },
    { role: 'assistant', content: '三层防误判：1) 置信度阈值——低于 0.7 不触发；2) 冷却期——同一节点 5 轮内不重复建议；3) 用户确认——AI 只是建议，用户点"分裂"才执行。另外可以学习用户的确认/拒绝模式来调整阈值。', timestamp: '2026-04-09T10:53:00Z' },
    { role: 'user', content: '这和拓扑引擎的关系是什么', timestamp: '2026-04-09T10:54:00Z' },
    { role: 'assistant', content: '深度耦合。分裂本质上是在拓扑引擎的 session tree 上执行 fork 操作——创建子节点、继承部分上下文、触发布局重算。两者需要同步迭代，不能独立开发。', timestamp: '2026-04-09T10:55:00Z' },
  ],
  's1-insight': [
    { role: 'user', content: '跨节点洞察是怎么一回事？怎么自动发现关联和矛盾', timestamp: '2026-04-09T11:20:00Z' },
    { role: 'assistant', content: '基于自动分裂产生的节点摘要，跨节点洞察通过 L1/L2/L3 三层记忆架构实现：L3 是节点内的原始对话，L2 是自动生成的节点摘要，L1 是跨节点的语义比对层。洞察就发生在 L1 层。', timestamp: '2026-04-09T11:21:00Z' },
    { role: 'user', content: '矛盾是怎么检测的？', timestamp: '2026-04-09T11:22:00Z' },
    { role: 'assistant', content: '把各节点的 L2 摘要做 embedding，然后两两计算语义相似度。相似度高的进一步用 LLM 判断：是"关联"（相互支持）还是"矛盾"（相互冲突）。比如"本地优先"和"云端同步"就会被标记为矛盾。', timestamp: '2026-04-09T11:23:00Z' },
    { role: 'user', content: '这跟自动分裂是什么关系', timestamp: '2026-04-09T11:24:00Z' },
    { role: 'assistant', content: '是一条流水线：分裂产生新节点 → 节点对话后自动生成 L2 摘要 → L1 层比对所有节点的摘要 → 发现关联和矛盾。分裂是输入，洞察是输出，中间靠摘要连接。', timestamp: '2026-04-09T11:25:00Z' },
  ],
  's1-arch': [
    { role: 'user', content: '技术架构怎么选型？有什么硬约束', timestamp: '2026-04-09T09:40:00Z' },
    { role: 'assistant', content: '推荐 TypeScript 全栈 + pnpm monorepo。后端用 Hono（轻量、快速、类型安全），底层复用 Stello SDK 的 session 管理能力。核心约束是"本地优先"——数据存在用户本地，不依赖云端。', timestamp: '2026-04-09T09:41:00Z' },
    { role: 'user', content: '为什么一定要本地优先？', timestamp: '2026-04-09T09:42:00Z' },
    { role: 'assistant', content: '三个原因：1) 隐私——思维过程是最隐私的数据，用户不愿意上传；2) 速度——本地读写比网络请求快一个数量级；3) 可控性——不依赖服务商，不会因为服务下线而丢失思考记录。', timestamp: '2026-04-09T09:43:00Z' },
    { role: 'user', content: '但这不是限制了可扩展性吗？', timestamp: '2026-04-09T09:44:00Z' },
    { role: 'assistant', content: '确实存在张力。本地优先意味着放弃了实时协作、跨设备同步等云端优势。后续可能需要一个 hybrid 方案——核心数据本地存储，可选的云端同步层。但 MVP 阶段先把本地做好。', timestamp: '2026-04-09T09:45:00Z' },
  ],
  's1-local': [
    { role: 'user', content: '本地存储具体用什么方案？文件系统还是 SQLite', timestamp: '2026-04-09T11:00:00Z' },
    { role: 'assistant', content: '推荐文件系统方案：每个 Space 一个目录，session tree 存为 tree.json，每个节点的对话存为 {nodeId}.jsonl。优点是零依赖、可 git 管理、人类可读。', timestamp: '2026-04-09T11:01:00Z' },
    { role: 'user', content: '为什么不用 SQLite？查询不是更方便吗', timestamp: '2026-04-09T11:02:00Z' },
    { role: 'assistant', content: 'SQLite 确实查询更强，但引入了二进制依赖（node-gyp 编译问题）和额外复杂度。我们的数据模型很简单——树结构 + 消息列表，文件系统完全够用。KISS 原则。', timestamp: '2026-04-09T11:03:00Z' },
    { role: 'user', content: '那数据同步怎么办？以后如果要多设备', timestamp: '2026-04-09T11:04:00Z' },
    { role: 'assistant', content: '这就是本地优先的代价了。文件系统方案天然不支持实时同步。未来如果要做多设备同步，可能需要一个 CRDT 层或者 git-like 的合并机制。但这和云端部署方案存在冲突，需要后续讨论。', timestamp: '2026-04-09T11:05:00Z' },
  ],
  's1-llm': [
    { role: 'user', content: 'LLM 接入层怎么设计？只支持一个模型吗', timestamp: '2026-04-09T11:10:00Z' },
    { role: 'assistant', content: '建议做 provider-agnostic 的抽象层：统一的接口，后面可以接 Claude、GPT、Gemini 甚至本地模型（Ollama）。核心是定义好 LLMProvider interface，包括 chat、stream、embedding 三个方法。', timestamp: '2026-04-09T11:11:00Z' },
    { role: 'user', content: '多模型有什么好处？', timestamp: '2026-04-09T11:12:00Z' },
    { role: 'assistant', content: '用户选择权 + 成本控制。不同任务可以用不同模型：深度思考用 Claude Opus，快速问答用 Sonnet，摘要和分类用 Haiku。用户也可以接自己的 API key 降低成本。', timestamp: '2026-04-09T11:13:00Z' },
    { role: 'user', content: '成本怎么控制？每个节点都调 LLM 开销很大', timestamp: '2026-04-09T11:14:00Z' },
    { role: 'assistant', content: '三个手段：1) Token 预算——每个节点设上限，超过后提醒用户分裂或总结；2) 上下文窗口管理——只发送最近 N 轮 + L2 摘要，而非全量历史；3) 分级模型——L2 摘要生成用便宜模型，L3 对话用贵模型。', timestamp: '2026-04-09T11:15:00Z' },
  ],
  's1-deploy': [
    { role: 'user', content: '部署方案怎么选？纯本地还是也支持云端', timestamp: '2026-04-09T13:00:00Z' },
    { role: 'assistant', content: '三种可选路径：1) 纯本地 CLI——npm install 后本地跑；2) Electron 桌面应用——更友好的安装体验；3) 云端 SaaS——Web 直接访问。这三个不互斥但优先级不同。', timestamp: '2026-04-09T13:01:00Z' },
    { role: 'user', content: '但你之前说要本地优先，云端不是矛盾了吗', timestamp: '2026-04-09T13:02:00Z' },
    { role: 'assistant', content: '确实和本地优先存储的原则存在矛盾。纯云端意味着数据在服务器上，违背隐私承诺；纯本地又限制了 Web 访问和跨设备体验。这是一个需要认真取舍的架构矛盾。', timestamp: '2026-04-09T13:03:00Z' },
    { role: 'user', content: '有没有折中方案', timestamp: '2026-04-09T13:04:00Z' },
    { role: 'assistant', content: '推荐 hybrid 方案：默认本地优先（CLI 或 Electron），可选的云端同步层——数据加密后上传，云端只做中转不做计算。这样既保持隐私承诺，又能支持跨设备。但 MVP 先做纯本地。', timestamp: '2026-04-09T13:05:00Z' },
  ],
  's1-biz': [
    { role: 'user', content: '商业化路径怎么走？怎么赚钱', timestamp: '2026-04-09T12:00:00Z' },
    { role: 'assistant', content: '基于用户画像中独立开发者的定位，商业化可以分三阶段：1) 免费增值——核心功能免费，高级功能付费；2) 团队版——多人协作场景收费；3) 平台化——Market 模板分成。', timestamp: '2026-04-09T12:01:00Z' },
    { role: 'user', content: '有哪些商业模式可以参考？', timestamp: '2026-04-09T12:02:00Z' },
    { role: 'assistant', content: '三种模式：1) SaaS 订阅——按月收费，参考 Cursor $20/月；2) 许可证——一次性买断，参考 Raycast Pro；3) Open-core——核心开源，高级功能付费，参考 Supabase。对于开发者工具，open-core + SaaS 组合最有说服力。', timestamp: '2026-04-09T12:03:00Z' },
    { role: 'user', content: '什么时候开始收费？', timestamp: '2026-04-09T12:04:00Z' },
    { role: 'assistant', content: '不建议太早。先用免费版验证核心价值——用户是否真的会反复回来用、是否在节点里积累了有价值的思考。看到留存数据（7 日留存 > 30%）再启动收费。过早收费会阻碍获客。', timestamp: '2026-04-09T12:05:00Z' },
  ],
  's1-price': [
    { role: 'user', content: '定价怎么定？', timestamp: '2026-04-09T14:00:00Z' },
    { role: 'assistant', content: '结合用户画像中独立开发者 $15-25/月的付费意愿，建议三档定价：Free（基础体验）、Pro $19/月（完整功能）、Team $39/人/月（协作场景）。', timestamp: '2026-04-09T14:01:00Z' },
    { role: 'user', content: '免费版和付费版怎么区分？', timestamp: '2026-04-09T14:02:00Z' },
    { role: 'assistant', content: 'Free 版限制：3 个 Space、每 Space 50 节点、仅基础模型（Haiku 级别）、无跨节点洞察。Pro 版解锁：无限 Space、无限节点、多模型选择、完整洞察、产物生成。', timestamp: '2026-04-09T14:03:00Z' },
    { role: 'user', content: '会不会免费版太弱，用户直接流失', timestamp: '2026-04-09T14:04:00Z' },
    { role: 'assistant', content: '好的限制应该让用户"尝到甜头但意犹未尽"。3 个 Space + 50 节点足够完成一次完整的头脑风暴，但当你想同时推进多个项目时就不够了。关键是免费版也要能体验到分裂和关联的核心价值。', timestamp: '2026-04-09T14:05:00Z' },
  ],
  's1-oss': [
    { role: 'user', content: '要不要做开源？开发者工具好像都开源', timestamp: '2026-04-09T14:20:00Z' },
    { role: 'assistant', content: '建议 open-core 模式：核心拓扑引擎开源（MIT），高级功能（跨节点洞察、团队协作、高级模型接入）作为付费闭源模块。开源能获得社区信任和免费分发。', timestamp: '2026-04-09T14:21:00Z' },
    { role: 'user', content: '但这不是跟定价策略矛盾了吗？开源了谁还付费', timestamp: '2026-04-09T14:22:00Z' },
    { role: 'assistant', content: '确实存在矛盾——开源越多，Pro 版的付费价值越被稀释。关键是划好边界：开源的是"引擎"（拓扑渲染、基础对话），付费的是"智能"（洞察、自动分裂、高级 AI）。用户自己搭能跑起来，但缺少最有价值的智能层。', timestamp: '2026-04-09T14:23:00Z' },
    { role: 'user', content: '有没有成功案例可以参考', timestamp: '2026-04-09T14:24:00Z' },
    { role: 'assistant', content: 'Cursor 是最好的参考——编辑器基于 VSCode 开源，但 AI 能力完全闭源付费。Supabase 也是——PostgreSQL 开源，但托管和增值服务收费。关键是开源部分要有独立价值，付费部分要有不可替代的体验。', timestamp: '2026-04-09T14:25:00Z' },
  ],
  's1-growth': [
    { role: 'user', content: '增长怎么做？靠什么飞轮转起来', timestamp: '2026-04-09T14:40:00Z' },
    { role: 'assistant', content: '结合开源社区的分发优势，增长飞轮可以是：开源 → 社区用户 → 模板分享（Market）→ 更多用户看到 → 贡献更多模板 → 生态滚雪球。核心是让用户的使用过程本身就在产生可分享的价值。', timestamp: '2026-04-09T14:41:00Z' },
    { role: 'user', content: '有没有病毒传播的机制', timestamp: '2026-04-09T14:42:00Z' },
    { role: 'assistant', content: '模板分享天然有病毒性。想象一个用户用 MindKit 做了一个"创业 BP 规划"模板，发到 ProductHunt 上——别人看到就想试试，试了就会想做自己的模板。每个模板都是一个获客入口。', timestamp: '2026-04-09T14:43:00Z' },
    { role: 'user', content: '留存靠什么？工具类产品容易被替代', timestamp: '2026-04-09T14:44:00Z' },
    { role: 'assistant', content: '留存靠数据锁定。用户在 MindKit 里积累的思维拓扑、决策记录、知识网络是高度个人化的，迁移成本极高。用得越久，AI 越懂你的思维习惯——这是最强的留存护城河。', timestamp: '2026-04-09T14:45:00Z' },
  ],
  's1-mvp': [
    { role: 'user', content: 'MVP 应该做什么？哪些功能可以砍', timestamp: '2026-04-09T15:00:00Z' },
    { role: 'assistant', content: '极简 MVP：单 Space + 基础拓扑渲染 + 手动分裂（点击按钮） + 单模型对话。砍掉的：Market、自动分裂（改手动）、跨节点洞察、多模型、产物生成。目标是验证"拓扑对话"这个核心假设。', timestamp: '2026-04-09T15:01:00Z' },
    { role: 'user', content: '但自动分裂和洞察不是核心功能里说的差异化卖点吗？砍掉还有啥竞争力', timestamp: '2026-04-09T15:02:00Z' },
    { role: 'assistant', content: '确实跟核心功能规划存在矛盾——理想中的完整体验和 MVP 的资源约束之间需要取舍。我的建议是：手动分裂已经能让用户体验到拓扑的价值，自动分裂是锦上添花。先验证用户是否愿意主动分裂，如果答案是 yes，再自动化。', timestamp: '2026-04-09T15:03:00Z' },
    { role: 'user', content: '多久能做出来', timestamp: '2026-04-09T15:04:00Z' },
    { role: 'assistant', content: '4 周冲刺：W1 搭建骨架（monorepo + 路由 + 基础 UI），W2 核心功能（对话 + 拓扑渲染 + 手动分裂），W3 AI 接入（LLM 对话 + L2 摘要），W4 打磨（交互细节 + 错误处理 + 部署脚本）。一个全栈开发者可以搞定。', timestamp: '2026-04-09T15:05:00Z' },
  ],
  's1-plan': [
    { role: 'user', content: '落地计划是什么？总体时间线怎么排', timestamp: '2026-04-09T12:30:00Z' },
    { role: 'assistant', content: '三阶段计划：Phase 1（W1-4）——MVP 开发，验证核心循环；Phase 2（W5-8）——Beta 版，加入 Market、洞察、多模型；Phase 3（W9+）——正式上线 + 增长。每个阶段有明确的 Go/No-Go 标准。', timestamp: '2026-04-09T12:31:00Z' },
    { role: 'user', content: '每个阶段的里程碑是什么', timestamp: '2026-04-09T12:32:00Z' },
    { role: 'assistant', content: 'Phase 1 里程碑：可用的单 Space 拓扑 + 对话体验，10 个内测用户反馈。Phase 2 里程碑：Market 上线 + 3 个官方模板 + 50 个 beta 用户。Phase 3 里程碑：ProductHunt 发布 + 500 DAU。', timestamp: '2026-04-09T12:33:00Z' },
    { role: 'user', content: '团队怎么配？一个人够吗', timestamp: '2026-04-09T12:34:00Z' },
    { role: 'assistant', content: '最小团队 3 人：1 全栈（核心开发）+ 1 AI 工程师（LLM 集成和优化）+ 1 设计/增长（交互设计 + 社区运营）。一个人也能做出 MVP，但 beta 阶段开始需要分工。', timestamp: '2026-04-09T12:35:00Z' },
  ],
  's1-roadmap': [
    { role: 'user', content: '具体的上线时间表是什么，里程碑怎么定', timestamp: '2026-04-09T15:30:00Z' },
    { role: 'assistant', content: '基于 MVP 的 4 周开发周期：W1-4 MVP 开发 → W5 内部 dogfooding → W6-7 小范围内测（20 人）→ W8 公开 beta → W9 ProductHunt + HackerNews launch。总计约 2 个月从开发到公开发布。', timestamp: '2026-04-09T15:31:00Z' },
    { role: 'user', content: '上线策略是什么？怎么获取第一批用户', timestamp: '2026-04-09T15:32:00Z' },
    { role: 'assistant', content: '三管齐下：1) ProductHunt launch——开发者工具的标准首发渠道，准备好 demo GIF 和 landing page；2) HackerNews Show HN——写一篇技术博客讲"为什么线性对话不够用"；3) Twitter/X 社区——持续分享开发过程，建立期待感。', timestamp: '2026-04-09T15:33:00Z' },
    { role: 'user', content: '怎么衡量成功？', timestamp: '2026-04-09T15:34:00Z' },
    { role: 'assistant', content: '核心指标四个：1) DAU > 500——日活说明产品有黏性；2) 日均 Space 创建 > 50——说明用户在用来做真实事情；3) 平均节点深度 > 3——说明用户在深入思考而非浅尝辄止；4) 7 日留存 > 40%——说明价值被认可。这些数据 4 周内就能看到趋势。', timestamp: '2026-04-09T15:35:00Z' },
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
    // 深拷贝，确保 React 检测到引用变化触发重渲染
    return { tree: JSON.parse(JSON.stringify(mockTrees[spaceId] || [])) }
  }
  return request(`/spaces/${spaceId}/sessions`)
}

// sp-1 演示脚本：每次对话按顺序生长出预设节点
const sp1DemoSteps: { parentId: string; node: SessionTreeNode; reply: string; systemNotices?: string[] }[] = [
  // 1. 产品定位 — 从根节点分裂
  {
    parentId: 's1-main',
    node: { id: 's1-pos', label: '产品定位', status: 'active', turnCount: 0, children: [] },
    reply: '产品定位确实需要先想清楚。MindKit 本质上要回答三个问题：面向谁、解决什么问题、和现有工具有什么不同。从工具定位来看，它介于 ChatGPT（深度对话但线性）和 Miro（可视化但静态）之间，核心差异是"会生长的对话拓扑"。\n\n这个方向展开来说会比较长，我帮你单独开了一个「产品定位」节点来深入讨论。',
  },
  // 2. 核心功能 — 从根节点分裂
  {
    parentId: 's1-main',
    node: { id: 's1-feat', label: '核心功能', status: 'active', turnCount: 0, children: [] },
    reply: '功能规划要分层看。第一层是基础体验：对话 + 拓扑可视化；第二层是智能层：自动分裂、跨节点洞察；第三层是生态层：Market 模板、协作。优先级建议从第一层做起，但第二层才是真正的差异化卖点。\n\n我帮你创建了「核心功能」节点，后续我们可以在那边逐个拆解每个功能的设计细节。',
  },
  // 3. 技术架构 — 从根节点分裂
  {
    parentId: 's1-main',
    node: { id: 's1-arch', label: '技术架构', status: 'active', turnCount: 0, children: [] },
    reply: '技术选型最大的约束是"本地优先"——这不只是技术偏好，而是产品哲学。思维过程是最隐私的数据，用户不应该被迫把它上传到云端。这个约束会影响存储方案、部署方式、甚至商业模式。\n\n技术架构涉及的决策点比较多，我给你开了「技术架构」节点，我们可以逐项讨论。',
  },
  // 4. 用户画像 — 从产品定位分裂
  {
    parentId: 's1-pos',
    node: { id: 's1-user', label: '用户画像', status: 'active', turnCount: 0, children: [] },
    reply: '我梳理了三类潜在用户：\n\n1) 独立开发者/创业者——需要一个人扮演多角色（产品、技术、商业），现有工具（Notion/Miro）太静态\n2) 小团队 PM/Tech Lead——需要对齐团队认知，但文档和会议效率低\n3) AI 从业者/研究者——思维发散但需要结构化梳理\n\n这三类用户的需求差异很大，建议先聚焦一类。你觉得哪类优先？这块我开了「用户画像」节点来详细分析。',
  },
  // 5. 对话拓扑引擎 — 从核心功能分裂
  {
    parentId: 's1-feat',
    node: { id: 's1-topo', label: '对话拓扑引擎', status: 'active', turnCount: 0, children: [] },
    reply: '拓扑引擎是最底层的核心能力。它本质上是一个 Session Tree 数据结构：每个节点是独立会话（有自己的消息列表、上下文摘要），节点之间通过 parent-child 关系和 source/conflict 引用连接。前端用 Canvas 渲染，支持缩放、拖拽、节点点击切换。\n\n这是整个产品的技术地基，值得单独深入，我帮你开了「对话拓扑引擎」节点。',
  },
  // 6. 竞品分析 — 从产品定位分裂
  {
    parentId: 's1-pos',
    node: { id: 's1-comp', label: '竞品分析', status: 'active', turnCount: 0, children: [] },
    reply: '市面上的直接竞品不多，但间接竞品很多：\n\n- Notion AI：文档+AI，但对话是线性附加的\n- Miro AI：可视化+AI，但缺乏深度对话能力\n- ChatGPT/Claude：深度对话强，但没有结构化和分支管理\n- Cursor：代码场景做得很好，但不是通用思维工具\n\n目前没有一个产品同时做到"拓扑结构 + 多线程深度对话 + 跨节点智能"。这块可以深挖，我给你开了「竞品分析」节点。',
  },
  // 7. AI 自动分裂 — 从核心功能分裂（关联：拓扑引擎）
  {
    parentId: 's1-feat',
    node: { id: 's1-split', label: 'AI 自动分裂', status: 'active', turnCount: 0, sourceSessionId: 's1-topo', children: [] },
    reply: '自动分裂的核心逻辑是：LLM 分析每轮对话，检测是否出现了与当前节点主题显著偏离的新话题。当置信度高时，AI 会建议创建一个新节点。关键是不能太敏感（动不动分裂很烦），也不能太迟钝（用户自己发现不了该分裂的时机）。\n\n这个功能的设计细节比较复杂，我单独开了「AI 自动分裂」节点来讨论。',
    systemNotices: ['🔗 发现关联：「AI 自动分裂」的实现深度依赖「对话拓扑引擎」的节点管理和上下文继承能力，两者需要协同设计。'],
  },
  // 8. 本地优先存储 — 从技术架构分裂
  {
    parentId: 's1-arch',
    node: { id: 's1-local', label: '本地优先存储', status: 'active', turnCount: 0, children: [] },
    reply: '推荐文件系统方案：每个 Space 一个目录，Session Tree 存为 tree.json，每个节点的对话存为 {nodeId}.jsonl。这样做的好处是零依赖、人类可读、可以 git 管理。SQLite 查询更强但引入了二进制编译依赖，对我们目前简单的数据模型来说过度了。\n\n存储方案涉及的决策比较多，我开了「本地优先存储」节点来细化。',
  },
  // 9. 差异化定位 — 从产品定位分裂（关联：竞品分析）
  {
    parentId: 's1-pos',
    node: { id: 's1-diff', label: '差异化定位', status: 'active', turnCount: 0, sourceSessionId: 's1-comp', children: [] },
    reply: '综合来看，MindKit 的核心差异化有三点：\n\n1) 对话不是线性的，而是一棵会生长的树——每个想法都能独立深入\n2) AI 有"跨节点意识"——能自动发现不同节点之间的关联和矛盾\n3) 本地优先——思维数据完全掌控在用户手里\n\n一句话定位：「让你的思维像代码一样可以 fork 和 merge 的 AI 工具」。\n\n差异化这个话题足够重要，我开了「差异化定位」节点来专门讨论。',
    systemNotices: ['🔗 发现关联：「差异化定位」的结论直接基于「竞品分析」中的市场空白发现，两者紧密关联。'],
  },
  // 10. LLM 接入层 — 从技术架构分裂
  {
    parentId: 's1-arch',
    node: { id: 's1-llm', label: 'LLM 接入层', status: 'active', turnCount: 0, children: [] },
    reply: '建议做 provider-agnostic 的抽象层：统一的 LLMProvider 接口，后面可以接 Claude、GPT、Gemini 甚至本地模型（Ollama）。不同任务用不同模型——深度思考用 Opus，快速问答用 Sonnet，摘要分类用 Haiku。用户也可以接自己的 API key 降低成本。\n\n多模型接入有不少设计决策，我开了「LLM 接入层」节点。',
  },
  // 11. 跨节点洞察 — 从核心功能分裂（关联：AI 自动分裂）
  {
    parentId: 's1-feat',
    node: { id: 's1-insight', label: '跨节点洞察', status: 'active', turnCount: 0, sourceSessionId: 's1-split', children: [] },
    reply: '跨节点洞察通过三层记忆架构实现：L3 是节点内的原始对话，L2 是自动生成的节点摘要，L1 是跨节点的语义比对层。洞察就发生在 L1 层——把各节点的 L2 摘要做 embedding，两两比较，相似度高的进一步用 LLM 判断是"关联"（相互支持）还是"矛盾"（相互冲突）。\n\n这是产品的智能核心，我帮你开了「跨节点洞察」节点来详细设计。',
    systemNotices: ['🔗 发现关联：「跨节点洞察」是「AI 自动分裂」的下游能力——分裂产生节点，洞察发现节点间的隐含关系。'],
  },
  // 12. 商业化 — 从根节点分裂（关联：用户画像）
  {
    parentId: 's1-main',
    node: { id: 's1-biz', label: '商业化', status: 'active', turnCount: 0, sourceSessionId: 's1-user', children: [] },
    reply: '商业化可以分三个阶段思考：\n\n1) 免费增值——核心功能免费，高级 AI 能力付费，先让用户用起来\n2) 团队版——多人协作场景，按座收费\n3) 平台化——Market 模板分成，让社区创造价值\n\n不过说实话，商业模式高度依赖目标用户是谁、他们愿意为什么付费。这个方向比较独立，我给你开了「商业化」节点。',
    systemNotices: ['🔗 发现关联：「商业化」路径与「用户画像」直接相关——定价策略和获客渠道都取决于目标用户的付费习惯和使用场景。'],
  },
  // 13. 落地计划 — 从根节点分裂
  {
    parentId: 's1-main',
    node: { id: 's1-plan', label: '落地计划', status: 'active', turnCount: 0, children: [] },
    reply: '从 idea 到上线，建议分三个 phase：\n\nPhase 1（4 周）——MVP 开发，验证核心假设：用户是否愿意用"拓扑对话"来思考\nPhase 2（4 周）——Beta 版，加入 Market、洞察、多模型\nPhase 3（2 周+）——正式上线 + 增长\n\n每个阶段都要有明确的 Go/No-Go 标准，不盲目往下推。落地计划的细节我开了个节点来规划。',
  },
  // 14. 部署方案 — 从技术架构分裂（关联：LLM，矛盾：本地优先）
  {
    parentId: 's1-arch',
    node: { id: 's1-deploy', label: '部署方案', status: 'active', turnCount: 0, sourceSessionId: 's1-llm', conflictSessionId: 's1-local', children: [] },
    reply: '部署有三条路径：1) 纯本地 CLI——npm install 后本地跑，最符合本地优先原则；2) Electron 桌面应用——更友好的安装体验；3) 云端 SaaS——Web 直接访问，用户零门槛。\n\n但说实话，这里有一个绕不开的架构矛盾——如果坚持本地优先，云端 SaaS 就很难做；如果为了降低门槛做云端，数据隐私承诺就要打折扣。需要认真取舍。\n\n我帮你开了「部署方案」节点来讨论这个取舍。',
    systemNotices: [
      '🔗 发现关联：「部署方案」与「LLM 接入层」的模型调用方式紧密相关——本地部署需要考虑 API key 管理和网络访问。',
      '⚡ 发现矛盾：「部署方案」中的云端 SaaS 路径与「本地优先存储」的核心架构原则存在根本冲突——数据存放位置无法两全。',
    ],
  },
  // 15. 定价策略 — 从商业化分裂（关联：用户画像）
  {
    parentId: 's1-biz',
    node: { id: 's1-price', label: '定价策略', status: 'active', turnCount: 0, sourceSessionId: 's1-user', children: [] },
    reply: '参考开发者工具的定价区间（Cursor $20/月、Notion AI $10/月），建议三档：\n\n- Free：3 个 Space、每 Space 50 节点、基础模型\n- Pro $19/月：无限 Space 和节点、多模型、跨节点洞察\n- Team $39/人/月：协作 + 管理后台\n\n关键是免费版要让用户"尝到甜头但意犹未尽"——能完成一次完整头脑风暴，但想同时推进多个项目就不够了。\n\n定价有不少细节要讨论，我开了「定价策略」节点。',
    systemNotices: ['🔗 发现关联：「定价策略」的定价区间直接参考了「用户画像」中独立开发者的付费意愿分析（$15-25/月舒适区）。'],
  },
  // 16. 开源社区 — 从商业化分裂（矛盾：定价策略）
  {
    parentId: 's1-biz',
    node: { id: 's1-oss', label: '开源社区', status: 'active', turnCount: 0, conflictSessionId: 's1-price', children: [] },
    reply: '建议 open-core 模式：核心拓扑引擎开源（MIT），高级功能（洞察、协作、高级 AI）作为付费闭源模块。开源的好处是社区信任、免费分发、社区贡献；但边界很关键——开源太多，Pro 版就没价值了。\n\n参考 Cursor：编辑器基于 VSCode 开源，但 AI 能力完全闭源。关键是开源部分有独立价值，付费部分有不可替代的体验。\n\n这个话题我开了「开源社区」节点来讨论。',
    systemNotices: ['⚡ 发现矛盾：「开源社区」的策略与「定价策略」存在张力——开源程度越高，Pro 版的付费壁垒越弱，需要精确划定开源边界。'],
  },
  // 17. 极简 MVP — 从落地计划分裂（矛盾：核心功能）
  {
    parentId: 's1-plan',
    node: { id: 's1-mvp', label: '极简 MVP', status: 'active', turnCount: 0, conflictSessionId: 's1-feat', children: [] },
    reply: '极简 MVP 的范围建议：单 Space + 基础拓扑渲染 + 手动分裂 + 单模型对话。砍掉的功能：Market、自动分裂（改手动）、跨节点洞察、多模型、产物生成。\n\n目标是用最小成本验证核心假设——用户是否真的愿意用"拓扑"来组织思考，而不是停留在线性对话里。如果手动分裂都没人用，自动化也没意义。\n\n4 周可以做出来，我开了「极简 MVP」节点来细化排期。',
    systemNotices: ['⚡ 发现矛盾：「极简 MVP」需要大量砍功能（自动分裂、洞察、多模型），这与「核心功能」中规划的完整差异化体验存在冲突——需要在速度和完整性之间取舍。'],
  },
  // 18. 增长飞轮 — 从商业化分裂（关联：开源社区）
  {
    parentId: 's1-biz',
    node: { id: 's1-growth', label: '增长飞轮', status: 'active', turnCount: 0, sourceSessionId: 's1-oss', children: [] },
    reply: '增长飞轮的核心循环：开源吸引开发者 → 开发者使用并创建模板 → 模板分享到 Market → 更多用户发现 MindKit → 部分转化为付费用户 → 收入投入产品迭代。\n\n每个模板本身就是一个获客入口——想象有人在 ProductHunt 上分享一个"创业 BP 规划"模板，别人点进来就能直接用。留存则靠数据锁定——用户积累的思维拓扑和知识网络迁移成本极高。\n\n增长策略我开了「增长飞轮」节点。',
    systemNotices: ['🔗 发现关联：「增长飞轮」的核心引擎是「开源社区」带来的免费分发——社区用户是天然的种子用户池和内容贡献者。'],
  },
  // 19. 上线路线图 — 从落地计划分裂（关联：极简 MVP）
  {
    parentId: 's1-plan',
    node: { id: 's1-roadmap', label: '上线路线图', status: 'active', turnCount: 0, sourceSessionId: 's1-mvp', children: [] },
    reply: '基于 MVP 的 4 周周期，整体时间表：\n\nW1-4：MVP 开发 → W5：内部 dogfooding → W6-7：小范围内测（20人）→ W8：公开 beta → W9：ProductHunt + HackerNews launch\n\n关键里程碑：W4 有可用产品、W7 内测留存 > 30%（Go/No-Go）、W9 公开发布目标 500 DAU。\n\n三管齐下获客：ProductHunt launch + HN 技术博客 "为什么线性对话不够用" + Twitter 持续分享开发过程。\n\n我开了「上线路线图」节点来细化每周任务。',
    systemNotices: ['🔗 发现关联：「上线路线图」的时间表直接基于「极简 MVP」确定的功能范围来倒推——MVP 范围变化会直接影响上线时间。'],
  },
]

export const sp1AutoDemo: { targetSessionId: string; userInput: string; createdNodeId: string }[] = [
  { targetSessionId: 's1-main', userInput: '先聊聊产品定位吧，MindKit 到底要做成什么样的东西', createdNodeId: 's1-pos' },
  { targetSessionId: 's1-main', userInput: '那核心功能呢，哪些是必须做的', createdNodeId: 's1-feat' },
  { targetSessionId: 's1-main', userInput: '技术上有什么需要提前想清楚的吗', createdNodeId: 's1-arch' },
  { targetSessionId: 's1-pos', userInput: '我们的目标用户到底是谁，能不能具体一点', createdNodeId: 's1-user' },
  { targetSessionId: 's1-feat', userInput: '我觉得拓扑引擎是最核心的，展开说说怎么设计', createdNodeId: 's1-topo' },
  { targetSessionId: 's1-pos', userInput: '市面上有没有类似的产品，我们跟他们比怎么样', createdNodeId: 's1-comp' },
  { targetSessionId: 's1-feat', userInput: '自动分裂这个怎么做，什么时候该触发什么时候不该', createdNodeId: 's1-split' },
  { targetSessionId: 's1-arch', userInput: '数据存哪里，用文件系统还是数据库', createdNodeId: 's1-local' },
  { targetSessionId: 's1-pos', userInput: '综合竞品来看，我们的核心差异化到底是什么', createdNodeId: 's1-diff' },
  { targetSessionId: 's1-arch', userInput: 'LLM 接入怎么做，只支持一家不太好吧', createdNodeId: 's1-llm' },
  { targetSessionId: 's1-feat', userInput: '跨节点洞察是怎么回事，能自动发现不同节点之间的联系吗', createdNodeId: 's1-insight' },
  { targetSessionId: 's1-main', userInput: '聊聊商业化吧，这个东西怎么赚钱', createdNodeId: 's1-biz' },
  { targetSessionId: 's1-main', userInput: '那落地计划呢，总不能一直想不动手', createdNodeId: 's1-plan' },
  { targetSessionId: 's1-arch', userInput: '部署怎么搞，用户怎么用到这个产品', createdNodeId: 's1-deploy' },
  { targetSessionId: 's1-biz', userInput: '定价怎么定，免费给多少付费给多少', createdNodeId: 's1-price' },
  { targetSessionId: 's1-biz', userInput: '要不要开源？开发者工具好像都在做开源', createdNodeId: 's1-oss' },
  { targetSessionId: 's1-plan', userInput: 'MVP 做哪些就够了，哪些可以先不做', createdNodeId: 's1-mvp' },
  { targetSessionId: 's1-biz', userInput: '增长靠什么，冷启动怎么搞', createdNodeId: 's1-growth' },
  { targetSessionId: 's1-plan', userInput: '给我排一个具体的上线时间表', createdNodeId: 's1-roadmap' },
]

// 备份 sp-1 节点的对话数据（重置时恢复）
const sp1MessageBackup: Record<string, TurnRecord[]> = {}
for (const key of Object.keys(mockMessages)) {
  if (key.startsWith('s1-')) {
    sp1MessageBackup[key] = mockMessages[key].map((m) => ({ ...m }))
  }
}

/** 获取并消费节点的对话脚本（返回后清空，后续 getSessionMessages 返回空） */
export function consumeNodeConversation(nodeId: string): TurnRecord[] {
  const records = mockMessages[nodeId]
  if (!records || records.length === 0) return []
  const copy = [...records]
  mockMessages[nodeId] = []
  return copy
}
let sp1StepIndex = 0

/** 重置 sp-1 演示到初始状态（只剩根节点，恢复对话数据和产物） */
export function resetSp1Demo() {
  sp1StepIndex = 0
  mockTrees['sp-1'] = [
    { id: 's1-main', label: 'MindKit', status: 'active', turnCount: 1, children: [] },
  ]
  // 恢复对话数据
  for (const key of Object.keys(sp1MessageBackup)) {
    mockMessages[key] = sp1MessageBackup[key].map((m) => ({ ...m }))
  }
  // 清空产物
  mockProducts['sp-1'] = []
}

export async function sendTurn(spaceId: string, sessionId: string, _input: string): Promise<TurnResult> {
  if (MOCK) {
    await delay(800 + Math.random() * 700)
    const tree = mockTrees[spaceId]
    const findNode = (nodes: SessionTreeNode[], id: string): SessionTreeNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n
        const found = findNode(n.children, id)
        if (found) return found
      }
      return null
    }

    // sp-1 走演示脚本
    if (spaceId === 'sp-1' && sp1StepIndex < sp1DemoSteps.length && tree) {
      const step = sp1DemoSteps[sp1StepIndex++]
      const parent = findNode(tree, step.parentId)
      if (parent) parent.children.push({ ...step.node, children: [] })
      return { response: step.reply, records: [], systemNotices: step.systemNotices }
    }

    // 其他 space 走通用逻辑
    const forkLabel = _input.slice(0, 12)
    if (tree) {
      const parent = findNode(tree, sessionId)
      if (parent) {
        parent.children.push({
          id: `fork-${++idCounter}`,
          label: forkLabel,
          status: 'active',
          turnCount: 0,
          children: [],
        })
      }
    }
    const reply = `好的，识别到新话题，正在分裂出新节点...\n\n✦ 话题分裂：已创建新节点「${forkLabel}」，可在拓扑图中点击进入。`
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
      conflictSessionId: node.conflictSessionId ? idMap[node.conflictSessionId] : undefined,
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

// sp-1 的产物数据（演示时动态添加）
const sp1Products: Product[] = [
  { id: 'prod-1', type: 'PRD 文档', title: 'MindKit 产品需求文档 v0.1', summary: 'AI-native 思维拓扑工具的完整产品需求规格，涵盖定位、用户画像、核心功能和竞品分析', sourceNodeIds: ['s1-main', 's1-pos', 's1-user', 's1-comp', 's1-diff', 's1-feat'], content: '# MindKit 产品需求文档\n\n## 产品定位\nAI-native thinking partner——让思考像树一样生长，而不是像水一样流走。\n\n## 目标用户\n独立开发者为核心，25-35 岁全栈工程师，月付费意愿 $15-25。\n\n## 核心功能\n1. **对话拓扑引擎** — Session Tree + Canvas 渲染 + 力导向布局\n2. **AI 自动分裂** — LLM 话题漂移检测，置信度 > 0.7 触发\n3. **跨节点洞察** — L1/L2/L3 三层记忆，自动发现关联和矛盾\n\n## 竞品分析\n- ChatGPT：深度对话但线性，无结构化\n- Notion AI：文档内嵌 AI，非对话驱动\n- Miro：可视化画布，缺乏 AI 深度交互\n- Cursor：代码场景，证明开发者愿意为 AI 工具付费\n\n## 差异化\n唯一同时具备动态拓扑、AI 驱动分裂、跨节点智能的产品。数据护城河来自用户积累的思维模式。', createdAt: '2026-04-09T12:00:00Z', updatedAt: '2026-04-09T15:00:00Z' },
  { id: 'prod-2', type: '技术方案', title: 'MindKit 技术架构设计文档', summary: '本地优先架构方案：TypeScript 全栈 + Hono 后端 + 文件系统持久化 + 多模型 LLM 抽象层', sourceNodeIds: ['s1-arch', 's1-local', 's1-llm', 's1-deploy', 's1-topo'], content: '# MindKit 技术架构\n\n## 技术栈\n- TypeScript 严格模式 + pnpm monorepo\n- 后端：Hono + @hono/node-server + ws\n- 前端：React + Vite + Canvas 2D\n- 存储：文件系统（NodeFileSystemAdapter）\n\n## 核心架构原则\n**本地优先**：数据存在用户本地，零外部依赖。每个 Space 一个目录，tree.json + {nodeId}.jsonl。\n\n## LLM 接入层\nProvider-agnostic 抽象：统一 LLMProvider interface（chat/stream/embedding），支持 Claude/GPT/Ollama。Token 预算按节点控制。\n\n## 部署方案\nHybrid 路径：默认本地 CLI，未来可选 Electron 桌面应用和加密云端同步。\n\n## 性能策略\n- Canvas 视口裁剪：只渲染可见区域节点\n- 子树懒加载：折叠节点不渲染\n- 上下文窗口管理：最近 N 轮 + L2 摘要', createdAt: '2026-04-09T10:00:00Z', updatedAt: '2026-04-09T14:00:00Z' },
  { id: 'prod-3b', type: '商业计划书', title: 'MindKit 商业化方案', summary: '面向独立开发者的 open-core 商业模式，Free/Pro/Team 三档定价，开源社区驱动增长', sourceNodeIds: ['s1-biz', 's1-price', 's1-oss', 's1-growth', 's1-user'], content: '# MindKit 商业计划书\n\n## 商业模式\nOpen-core + SaaS 订阅：核心拓扑引擎开源（MIT），高级智能功能付费。\n\n## 定价策略\n| 档位 | 价格 | 核心权益 |\n|------|------|----------|\n| Free | $0 | 3 Space / 50 节点 / 基础模型 |\n| Pro | $19/月 | 无限 Space / 多模型 / 完整洞察 |\n| Team | $39/人/月 | 协作 / 共享 Space / 管理后台 |\n\n## 增长飞轮\n开源社区 → 模板分享（Market）→ 用户沉淀数据 → 网络效应 → 更多社区贡献。\n\n## 关键矛盾\n- 开源范围 vs Pro 付费价值：引擎开源、智能闭源\n- 本地优先 vs 云端协作：hybrid 方案分阶段推进\n\n## 预期指标\nY1 目标：5000 免费用户，500 付费用户，$114K ARR', createdAt: '2026-04-09T13:00:00Z', updatedAt: '2026-04-09T15:30:00Z' },
  { id: 'prod-4b', type: '上线路线图', title: 'MindKit 上线路线图', summary: '从 MVP 到正式上线的 9 周计划，含里程碑、团队配置和成功指标', sourceNodeIds: ['s1-plan', 's1-mvp', 's1-roadmap'], content: '# MindKit 上线路线图\n\n## Phase 1: MVP（W1-4）\n- 单 Space + 基础拓扑渲染 + 手动分裂 + 单模型\n- 里程碑：可用的核心循环，10 个内测用户反馈\n- 团队：1 全栈开发者\n\n## Phase 2: Beta（W5-8）\n- Market 模板 + 跨节点洞察 + 多模型 + 自动分裂\n- 里程碑：3 个官方模板，50 个 beta 用户\n- 团队扩至 3 人\n\n## Phase 3: Launch（W9+）\n- ProductHunt + HackerNews + Twitter 社区发布\n- 里程碑：DAU 500 / 日均创建 50 Space / 7 日留存 40%\n\n## 关键取舍\n- MVP 砍掉自动分裂和洞察（与完整功能规划矛盾）\n- 先验证"用户是否愿意主动分裂"，再自动化\n\n## 成功标准\n| 指标 | 目标 | 时间 |\n|------|------|------|\n| DAU | 500 | W12 |\n| 付费转化 | 10% | W16 |\n| 节点深度 | >3 | W10 |', createdAt: '2026-04-09T14:00:00Z', updatedAt: '2026-04-09T16:00:00Z' },
]

/** 产物生成触发点：step 索引 → 产物索引 + 系统通知 + skill 调用信息 */
export const sp1ProductTriggers: Record<number, {
  productIndex: number
  notice: string
  skillName: string
  skillDesc: string
  sourceNodes: string[]
  productTitle: string
}> = {
  // step 8 (差异化定位完成) → PRD
  8: {
    productIndex: 0,
    notice: '📄 产物生成：基于「产品定位」「用户画像」「竞品分析」「差异化」「核心功能」等节点的讨论，已自动汇总生成「MindKit 产品需求文档 v0.1」',
    skillName: 'prd-generator',
    skillDesc: '汇总多节点讨论，生成结构化产品需求文档',
    sourceNodes: ['产品定位', '用户画像', '竞品分析', '差异化定位', '核心功能', '对话拓扑引擎'],
    productTitle: 'MindKit 产品需求文档 v0.1',
  },
  // step 13 (部署方案完成) → 技术方案
  13: {
    productIndex: 1,
    notice: '📄 产物生成：基于「技术架构」「本地优先存储」「LLM 接入层」「部署方案」「拓扑引擎」等节点的讨论，已自动汇总生成「MindKit 技术架构设计文档」',
    skillName: 'tech-doc-writer',
    skillDesc: '提取技术讨论要点，生成架构设计文档',
    sourceNodes: ['技术架构', '本地优先存储', 'LLM 接入层', '部署方案', '对话拓扑引擎'],
    productTitle: 'MindKit 技术架构设计文档',
  },
  // step 17 (增长飞轮完成) → 商业计划书
  17: {
    productIndex: 2,
    notice: '📄 产物生成：基于「商业化」「定价策略」「开源社区」「增长飞轮」「用户画像」等节点的讨论，已自动汇总生成「MindKit 商业化方案」',
    skillName: 'biz-plan-builder',
    skillDesc: '整合商业分析节点，输出完整商业化方案',
    sourceNodes: ['商业化', '定价策略', '开源社区', '增长飞轮', '用户画像'],
    productTitle: 'MindKit 商业化方案',
  },
  // step 18 (上线路线图完成) → 上线路线图
  18: {
    productIndex: 3,
    notice: '📄 产物生成：基于「落地计划」「极简 MVP」「上线路线图」等节点的讨论，已自动汇总生成「MindKit 上线路线图」',
    skillName: 'roadmap-planner',
    skillDesc: '规划里程碑与时间线，生成项目路线图',
    sourceNodes: ['落地计划', '极简 MVP', '上线路线图'],
    productTitle: 'MindKit 上线路线图',
  },
}

/** 添加一个产物到 sp-1（演示用） */
export function addSp1Product(productIndex: number) {
  const prod = sp1Products[productIndex]
  if (!prod) return
  // 避免重复添加
  if (mockProducts['sp-1'].some((p) => p.id === prod.id)) return
  mockProducts['sp-1'].push({ ...prod })
}

const mockProducts: Record<string, Product[]> = {
  'sp-1': [],  // 演示时动态添加
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
    { id: 'evt-1', type: 'node_created', description: '创建 MindKit 根节点，开始商业化落地规划', nodeId: 's1-main', timestamp: '2026-04-09T09:00:00Z' },
    { id: 'evt-2', type: 'node_created', description: '话题分裂：从 MindKit 中拆分出产品定位线', nodeId: 's1-pos', timestamp: '2026-04-09T09:10:00Z' },
    { id: 'evt-3', type: 'node_created', description: '话题分裂：从 MindKit 中拆分出核心功能线', nodeId: 's1-feat', timestamp: '2026-04-09T09:20:00Z' },
    { id: 'evt-4', type: 'node_created', description: '话题分裂：从 MindKit 中拆分出技术架构线', nodeId: 's1-arch', timestamp: '2026-04-09T09:40:00Z' },
    { id: 'evt-5', type: 'node_created', description: '话题分裂：从产品定位中拆分出用户画像', nodeId: 's1-user', timestamp: '2026-04-09T09:30:00Z' },
    { id: 'evt-6', type: 'l2_updated', description: '用户画像节点摘要更新：锁定独立开发者群体', nodeId: 's1-user', timestamp: '2026-04-09T09:38:00Z' },
    { id: 'evt-7', type: 'node_created', description: '话题分裂：从核心功能中拆分出对话拓扑引擎', nodeId: 's1-topo', timestamp: '2026-04-09T10:30:00Z' },
    { id: 'evt-8', type: 'node_created', description: '话题分裂：从产品定位中拆分出竞品分析', nodeId: 's1-comp', timestamp: '2026-04-09T10:00:00Z' },
    { id: 'evt-9', type: 'cross_node_link', description: '发现关联：AI 自动分裂依赖对话拓扑引擎的节点管理', nodeId: 's1-split', relatedNodeIds: ['s1-topo'], timestamp: '2026-04-09T10:55:00Z' },
    { id: 'evt-10', type: 'cross_node_link', description: '发现关联：差异化定位基于竞品分析的发现', nodeId: 's1-diff', relatedNodeIds: ['s1-comp'], timestamp: '2026-04-09T10:25:00Z' },
    { id: 'evt-11', type: 'l2_updated', description: '竞品分析节点摘要更新：确认无竞品具备动态拓扑能力', nodeId: 's1-comp', timestamp: '2026-04-09T10:10:00Z' },
    { id: 'evt-12', type: 'insight_generated', description: '全局洞察：用户画像中的付费意愿直接约束定价策略区间', nodeId: 's1-main', relatedNodeIds: ['s1-user', 's1-price'], timestamp: '2026-04-09T15:20:00Z' },
    { id: 'evt-13', type: 'cross_node_link', description: '发现矛盾：部署方案的云端需求与本地优先存储冲突', nodeId: 's1-deploy', relatedNodeIds: ['s1-local'], timestamp: '2026-04-09T13:05:00Z' },
    { id: 'evt-14', type: 'insight_generated', description: '全局洞察：开源策略可能稀释 Pro 版付费价值', nodeId: 's1-main', relatedNodeIds: ['s1-oss', 's1-price'], timestamp: '2026-04-09T16:20:00Z' },
    { id: 'evt-15', type: 'cross_node_link', description: '发现矛盾：MVP 砍功能与核心功能完整规划冲突', nodeId: 's1-mvp', relatedNodeIds: ['s1-feat'], timestamp: '2026-04-09T15:03:00Z' },
    { id: 'evt-16', type: 'product_created', description: '产物生成：MindKit 产品需求文档 v0.1', nodeId: 's1-main', timestamp: '2026-04-09T12:00:00Z' },
    { id: 'evt-17', type: 'product_created', description: '产物生成：技术架构设计文档', nodeId: 's1-arch', timestamp: '2026-04-09T14:00:00Z' },
    { id: 'evt-18', type: 'product_created', description: '产物生成：MindKit 商业计划书', nodeId: 's1-biz', timestamp: '2026-04-09T15:30:00Z' },
    { id: 'evt-19', type: 'product_created', description: '产物生成：上线路线图', nodeId: 's1-plan', timestamp: '2026-04-09T16:00:00Z' },
    { id: 'evt-20a', type: 'insight_generated', description: '全局洞察：增长飞轮的模板分享机制可反哺开源社区生态', nodeId: 's1-main', relatedNodeIds: ['s1-growth', 's1-oss'], timestamp: '2026-04-09T16:40:00Z' },
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
    { id: 'ins-1', content: '「用户画像」中确定的独立开发者定位直接影响「定价策略」的价格区间设定（$15-25/月）', sourceNodeIds: ['s1-user', 's1-price'], sourceLabels: ['用户画像', '定价策略'], timestamp: '2026-04-09T15:20:00Z' },
    { id: 'ins-2', content: '「竞品分析」发现市面工具均缺少动态拓扑能力，这构成了「差异化定位」的核心壁垒', sourceNodeIds: ['s1-comp', 's1-diff'], sourceLabels: ['竞品分析', '差异化定位'], timestamp: '2026-04-09T15:35:00Z' },
    { id: 'ins-3', content: '「部署方案」的云端同步需求与「本地优先存储」的架构原则存在根本矛盾，需要 hybrid 方案', sourceNodeIds: ['s1-deploy', 's1-local'], sourceLabels: ['部署方案', '本地优先存储'], timestamp: '2026-04-09T16:00:00Z' },
    { id: 'ins-4', content: '「开源社区」的开放策略可能稀释「定价策略」中 Pro 版的付费价值，需要明确开源边界', sourceNodeIds: ['s1-oss', 's1-price'], sourceLabels: ['开源社区', '定价策略'], timestamp: '2026-04-09T16:20:00Z' },
    { id: 'ins-5', content: '「AI 自动分裂」依赖「对话拓扑引擎」的实时布局能力，两者需要同步开发迭代', sourceNodeIds: ['s1-split', 's1-topo'], sourceLabels: ['AI 自动分裂', '对话拓扑引擎'], timestamp: '2026-04-09T15:50:00Z' },
    { id: 'ins-6', content: '「极简 MVP」砍掉了「核心功能」中的跨节点洞察，但这恰恰是差异化卖点，需要权衡取舍', sourceNodeIds: ['s1-mvp', 's1-feat'], sourceLabels: ['极简 MVP', '核心功能'], timestamp: '2026-04-09T16:30:00Z' },
    { id: 'ins-7', content: '「增长飞轮」的模板分享机制可以反哺「开源社区」生态，形成正向循环', sourceNodeIds: ['s1-growth', 's1-oss'], sourceLabels: ['增长飞轮', '开源社区'], timestamp: '2026-04-09T16:40:00Z' },
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
