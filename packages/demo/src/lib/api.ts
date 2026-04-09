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
  { id: 'sp-1', label: 'MindKit 产品构建', emoji: '✨', color: '#3a6bc5', mode: 'AUTO', deliverables: ['PRD 文档', '技术方案'], description: '围绕 AI Native 产品方向展开发散讨论，涵盖用户画像、核心场景和 MVP 功能定义', systemPrompt: '', createdAt: '2026-04-08T00:00:00Z', lastActiveAt: '2026-04-09T14:30:00Z' },
  { id: 'sp-2', label: '留学咨询规划', emoji: '🎓', color: '#7E57C2', mode: 'AUTO', deliverables: ['选校清单', '时间线规划', '文书大纲'], description: '从择校到申请，系统规划美国 CS 硕士留学全流程', systemPrompt: '', createdAt: '2026-04-05T00:00:00Z', lastActiveAt: '2026-04-09T11:00:00Z' },
  { id: 'sp-3', label: '金融知识体系构建', emoji: '💹', color: '#c94a4a', mode: 'AUTO', deliverables: ['知识图谱', '投资框架'], description: '从宏观经济到个人投资，搭建系统性的金融认知框架', systemPrompt: '', createdAt: '2026-04-04T00:00:00Z', lastActiveAt: '2026-04-09T09:30:00Z' },
  { id: 'sp-4', label: '高二生物·必修三', emoji: '🧬', color: '#5ba85b', mode: 'AUTO', deliverables: ['知识梳理', '易错点总结'], description: '高二上学期生物必修三核心知识点系统学习与梳理', systemPrompt: '', createdAt: '2026-04-03T00:00:00Z', lastActiveAt: '2026-04-09T08:00:00Z' },
]

const mockTrees: Record<string, SessionTreeNode[]> = {
  // ── Space 1: MindKit 产品构建（演示用，初始只有根节点，对话后逐步生长）──
  'sp-1': [
    {
      id: 's1-main', label: 'MindKit', status: 'active', turnCount: 1, children: [],
    },
  ],
  // ── Space 2: 留学咨询规划 ──
  'sp-2': [
    {
      id: 's2-main', label: '留学总览', status: 'active', turnCount: 4, children: [
        {
          id: 's2-school', label: '选校策略', status: 'active', turnCount: 3, children: [
            { id: 's2-school-reach', label: '冲刺校', status: 'active', turnCount: 2, children: [] },
            { id: 's2-school-match', label: '匹配校', status: 'active', turnCount: 2, children: [] },
            { id: 's2-school-safe', label: '保底校', status: 'active', turnCount: 2, sourceSessionId: 's2-school-match', children: [] },
          ],
        },
        {
          id: 's2-bg', label: '背景提升', status: 'active', turnCount: 3, children: [
            { id: 's2-bg-research', label: '科研经历', status: 'active', turnCount: 2, children: [] },
            { id: 's2-bg-intern', label: '实习规划', status: 'active', turnCount: 2, children: [] },
            { id: 's2-bg-test', label: '标化考试', status: 'active', turnCount: 2, sourceSessionId: 's2-school-reach', children: [] },
          ],
        },
        {
          id: 's2-doc', label: '文书准备', status: 'active', turnCount: 3, sourceSessionId: 's2-bg', children: [
            { id: 's2-doc-ps', label: 'PS 主线', status: 'active', turnCount: 2, children: [] },
            { id: 's2-doc-cv', label: 'CV 优化', status: 'active', turnCount: 2, sourceSessionId: 's2-bg-research', children: [] },
            { id: 's2-doc-rl', label: '推荐信策略', status: 'active', turnCount: 1, children: [] },
          ],
        },
        {
          id: 's2-timeline', label: '时间线', status: 'active', turnCount: 2, conflictSessionId: 's2-bg-test', children: [
            { id: 's2-timeline-fall', label: '秋季申请节奏', status: 'active', turnCount: 2, children: [] },
            { id: 's2-timeline-spring', label: '春季备选方案', status: 'active', turnCount: 1, conflictSessionId: 's2-timeline-fall', children: [] },
          ],
        },
      ],
    },
  ],
  // ── Space 3: 金融知识体系构建 ──
  'sp-3': [
    {
      id: 's3-main', label: '金融认知框架', status: 'active', turnCount: 4, children: [
        {
          id: 's3-macro', label: '宏观经济', status: 'active', turnCount: 3, children: [
            { id: 's3-macro-policy', label: '货币政策', status: 'active', turnCount: 2, children: [] },
            { id: 's3-macro-cycle', label: '经济周期', status: 'active', turnCount: 2, children: [] },
            { id: 's3-macro-global', label: '全球化与汇率', status: 'active', turnCount: 2, sourceSessionId: 's3-macro-policy', children: [] },
          ],
        },
        {
          id: 's3-market', label: '资本市场', status: 'active', turnCount: 3, sourceSessionId: 's3-macro', children: [
            { id: 's3-market-stock', label: '股票市场', status: 'active', turnCount: 2, children: [] },
            { id: 's3-market-bond', label: '债券市场', status: 'active', turnCount: 2, conflictSessionId: 's3-market-stock', children: [] },
            { id: 's3-market-deriv', label: '衍生品', status: 'active', turnCount: 2, children: [] },
          ],
        },
        {
          id: 's3-invest', label: '投资策略', status: 'active', turnCount: 3, sourceSessionId: 's3-market', children: [
            { id: 's3-invest-value', label: '价值投资', status: 'active', turnCount: 2, children: [] },
            { id: 's3-invest-quant', label: '量化策略', status: 'active', turnCount: 2, conflictSessionId: 's3-invest-value', children: [] },
            { id: 's3-invest-asset', label: '资产配置', status: 'active', turnCount: 2, sourceSessionId: 's3-macro-cycle', children: [] },
          ],
        },
        {
          id: 's3-risk', label: '风险管理', status: 'active', turnCount: 2, sourceSessionId: 's3-invest', children: [
            { id: 's3-risk-measure', label: '风险度量', status: 'active', turnCount: 2, children: [] },
            { id: 's3-risk-hedge', label: '对冲策略', status: 'active', turnCount: 2, sourceSessionId: 's3-market-deriv', children: [] },
          ],
        },
      ],
    },
  ],
  // ── Space 4: 高二生物·必修三 ──
  'sp-4': [
    {
      id: 's4-main', label: '必修三总览', status: 'active', turnCount: 4, children: [
        {
          id: 's4-homeostasis', label: '稳态与调节', status: 'active', turnCount: 3, children: [
            { id: 's4-nerve', label: '神经调节', status: 'active', turnCount: 3, children: [
              { id: 's4-nerve-reflex', label: '反射弧', status: 'active', turnCount: 2, children: [] },
              { id: 's4-nerve-synapse', label: '突触传递', status: 'active', turnCount: 2, children: [] },
            ] },
            { id: 's4-hormone', label: '体液调节', status: 'active', turnCount: 3, sourceSessionId: 's4-nerve', children: [
              { id: 's4-hormone-feedback', label: '反馈调节', status: 'active', turnCount: 2, children: [] },
              { id: 's4-hormone-blood', label: '血糖调节', status: 'active', turnCount: 2, children: [] },
            ] },
            { id: 's4-immune', label: '免疫调节', status: 'active', turnCount: 3, children: [
              { id: 's4-immune-innate', label: '非特异性免疫', status: 'active', turnCount: 2, children: [] },
              { id: 's4-immune-adaptive', label: '特异性免疫', status: 'active', turnCount: 2, children: [] },
            ] },
          ],
        },
        {
          id: 's4-ecosystem', label: '生态系统', status: 'active', turnCount: 3, children: [
            { id: 's4-eco-struct', label: '生态系统结构', status: 'active', turnCount: 2, children: [] },
            { id: 's4-eco-energy', label: '能量流动', status: 'active', turnCount: 2, children: [] },
            { id: 's4-eco-matter', label: '物质循环', status: 'active', turnCount: 2, sourceSessionId: 's4-eco-energy', children: [] },
            { id: 's4-eco-info', label: '信息传递', status: 'active', turnCount: 2, sourceSessionId: 's4-nerve', children: [] },
          ],
        },
        {
          id: 's4-population', label: '种群与群落', status: 'active', turnCount: 3, children: [
            { id: 's4-pop-growth', label: '种群增长模型', status: 'active', turnCount: 2, children: [] },
            { id: 's4-pop-community', label: '群落演替', status: 'active', turnCount: 2, children: [] },
            { id: 's4-pop-relation', label: '种间关系', status: 'active', turnCount: 2, conflictSessionId: 's4-pop-growth', children: [] },
          ],
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
  // Space 2: 留学咨询规划
  's2-main': '留学规划总览：目标美国 CS 硕士，GPA 3.6/4.0，需在背景提升、选校、文书三条线并行推进，2026 秋季入学。',
  's2-school': '选校策略：按冲刺/匹配/保底三档分层，综合 US News 排名、科研方向匹配度、地理位置和奖学金政策。',
  's2-school-reach': '冲刺校清单：CMU SCS、Stanford MSCS、MIT EECS。GPA 偏低需用科研和实习弥补，CMU 最看重项目经历。',
  's2-school-match': '匹配校清单：UIUC MCS、UMich CSE、GaTech MSCS。录取率 15-30%，性价比最高的一档。',
  's2-school-safe': '保底校清单：NEU Align、NYU Tandon、USC CS37。录取确定性高，NEU 的 co-op 项目就业导向强。',
  's2-bg': '背景提升规划：科研发表 > 大厂实习 > 标化刷分，三条线按优先级并行推进。',
  's2-bg-research': '科研经历规划：联系本校导师进 NLP 实验室，目标产出一篇 workshop paper，暑假申请 CMU REU。',
  's2-bg-intern': '实习规划：暑假目标字节/腾讯 AI Lab 实习，秋招补一段 startup 经历体现 ownership。',
  's2-bg-test': '标化考试：GRE 目标 325+，托福目标 105+。冲刺校对 GRE 有隐性门槛，建议 8 月前出分。',
  's2-doc': '文书准备：PS 主线围绕"从课堂到实践的 AI 认知转变"，CV 突出项目产出和量化成果。',
  's2-doc-ps': 'PS 主线叙事：大二 NLP 课程启蒙 → 实验室科研深入 → 实习验证方向 → 申请目标聚焦，展现 growth arc。',
  's2-doc-cv': 'CV 优化策略：引用科研经历节点的产出，每段经历用 STAR 法量化（"提升模型 F1 score 12%"）。',
  's2-doc-rl': '推荐信策略：学术推荐找实验室导师，工业推荐找实习 mentor，第三封找课程教授（选成绩最好的课）。',
  's2-timeline': '时间线规划：7-8 月标化出分 → 9-10 月文书定稿 → 11 月 EA/ED → 12-1 月 RD，注意春季和秋季节奏冲突。',
  's2-timeline-fall': '秋季申请主节奏：12/15 前提交大部分 RD 申请，CMU 的 SCS 有 12/1 早截止需优先。',
  's2-timeline-spring': '春季备选方案：若秋季全拒，3 月启动春季申请（NEU Spring Admit），或转 gap year 策略。',
  // Space 3: 金融知识体系构建
  's3-main': '金融认知框架总览：从宏观经济运行逻辑出发，向下延伸到资本市场结构、投资策略方法论和风险管理工具。',
  's3-macro': '宏观经济基础：理解 GDP、通胀、利率三大核心指标的联动关系，这是所有金融分析的起点。',
  's3-macro-policy': '货币政策：央行通过利率、准备金率、公开市场操作调控货币供给，直接影响资产定价和信贷环境。',
  's3-macro-cycle': '经济周期：复苏→繁荣→衰退→萧条四阶段轮动，不同阶段的最优资产配置策略截然不同。',
  's3-macro-global': '全球化与汇率：汇率由利差、贸易差额、资本流动共同决定，引用货币政策节点的利率分析。',
  's3-market': '资本市场结构：股票、债券、衍生品三大板块，理解它们的风险收益特征和相互关联。',
  's3-market-stock': '股票市场：从基本面（PE/PB/ROE）到技术面（均线/MACD），建立多维度分析框架。',
  's3-market-bond': '债券市场：收益率曲线是经济风向标，债券与股票的负相关性是资产配置的基石。',
  's3-market-deriv': '衍生品入门：期权定价（Black-Scholes）、期货套保、互换合约，核心是风险转移而非投机。',
  's3-invest': '投资策略方法论：价值投资与量化策略代表两种认知范式，资产配置是两者的桥梁。',
  's3-invest-value': '价值投资：格雷厄姆的安全边际 + 巴菲特的护城河理论，核心是"用 5 毛买 1 块的东西"。',
  's3-invest-quant': '量化策略：因子模型（Fama-French）、统计套利、高频交易，用数据和算法替代主观判断。',
  's3-invest-asset': '资产配置：引用经济周期节点，美林时钟框架下的大类资产轮动——衰退买债、复苏买股、过热买商品。',
  's3-risk': '风险管理：投资不是追求收益最大化，而是风险调整后收益最大化。',
  's3-risk-measure': '风险度量工具：VaR、夏普比率、最大回撤，量化评估投资组合的风险暴露程度。',
  's3-risk-hedge': '对冲策略：引用衍生品节点的期权工具，用 protective put 和 collar 策略保护下行风险。',
  // Space 4: 高二生物·必修三
  's4-main': '必修三总览：围绕"生命系统的稳态与调节"这一核心主题，涵盖个体水平的三大调节方式和群体水平的生态学。',
  's4-homeostasis': '稳态与调节：内环境稳态是生命活动的基础，由神经-体液-免疫三大调节网络共同维持。',
  's4-nerve': '神经调节：兴奋在神经纤维上以电信号传导，在神经元之间以化学信号（突触）传递，速度快、精确。',
  's4-nerve-reflex': '反射弧：感受器→传入神经→神经中枢→传出神经→效应器，五个环节缺一不可，是神经调节的结构基础。',
  's4-nerve-synapse': '突触传递：突触前膜释放神经递质→突触间隙→突触后膜受体结合，单向传递是关键考点。',
  's4-hormone': '体液调节：激素通过血液运输作用于靶器官，与神经调节互为补充——神经调节快而精确，体液调节慢而持久。',
  's4-hormone-feedback': '反馈调节：下丘脑-垂体-甲状腺轴是经典的负反馈模型，血液中甲状腺激素浓度升高会抑制 TSH 分泌。',
  's4-hormone-blood': '血糖调节：胰岛素（降血糖）和胰高血糖素（升血糖）拮抗调节，糖尿病的本质是这个平衡被打破。',
  's4-immune': '免疫调节：非特异性免疫是第一二道防线，特异性免疫（细胞免疫+体液免疫）是第三道防线。',
  's4-immune-innate': '非特异性免疫：皮肤黏膜（第一道）+ 吞噬细胞和体液杀菌物质（第二道），先天具有、不针对特定病原体。',
  's4-immune-adaptive': '特异性免疫：T 细胞主导细胞免疫（靶细胞裂解），B 细胞主导体液免疫（抗体分泌），产生记忆细胞是免疫接种的原理。',
  's4-ecosystem': '生态系统：由生物群落和无机环境构成，核心功能是能量流动、物质循环和信息传递。',
  's4-eco-struct': '生态系统结构：生产者→消费者→分解者构成营养结构，食物链和食物网是能量流动的渠道。',
  's4-eco-energy': '能量流动：沿食物链单向流动、逐级递减，每个营养级的同化量约 10-20% 传递给下一级。',
  's4-eco-matter': '物质循环：碳循环和氮循环是重点，物质在生物群落与无机环境间循环往复，与能量流动同时进行。',
  's4-eco-info': '信息传递：物理信息、化学信息、行为信息，引用神经调节节点理解生态系统中信息传递的生物学基础。',
  's4-population': '种群与群落：种群是物种的生存单位，群落是种群的组合，从个体到群落是生态学的基本层次递进。',
  's4-pop-growth': '种群增长模型：J 型增长（理想条件）vs S 型增长（环境阻力），K 值（环境容纳量）是核心概念。',
  's4-pop-community': '群落演替：初生演替（裸岩→森林）和次生演替（弃耕农田→森林），人类活动可以改变演替方向和速度。',
  's4-pop-relation': '种间关系：竞争、捕食、互利共生、寄生四种类型，竞争排斥原理与种群增长模型存在理论张力。',
}

/** Mock L3 对话记录 */
const mockMessages: Record<string, TurnRecord[]> = {
  // ── Space 1: MindKit 产品构建（MindKit 商业化落地规划）──
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
  // ── Space 2: 留学咨询规划 ──
  's2-main': [
    { role: 'user', content: '我想申请美国 CS 硕士，本科 985 计算机，GPA 3.6，有两段实习，帮我规划一下', timestamp: '2026-04-05T09:00:00Z' },
    { role: 'assistant', content: '背景不错！985 CS + 3.6 GPA 在美硕申请中属于中上水平。两段实习是加分项，关键要看项目含金量。你的标化成绩怎么样？GRE 和托福考了吗？', timestamp: '2026-04-05T09:01:00Z' },
    { role: 'user', content: '托福 100，GRE 还没考，打算暑假考。另外我有一段 NLP 方向的本科毕设经历，但没发论文', timestamp: '2026-04-05T09:02:00Z' },
    { role: 'assistant', content: '托福 100 够用但不突出，冲刺校建议刷到 105+。GRE 目标 325+，8 月前出分比较稳妥。NLP 毕设虽然没发论文，但如果有代码产出和量化结果，CV 上也能写得很漂亮。\n\n整体来看你的背景适合"冲 Top 20 + 稳 Top 30-50"的策略。建议我们从四条线并行展开：选校策略、背景提升、文书准备、时间线规划。', timestamp: '2026-04-05T09:03:00Z' },
    { role: 'user', content: '好的，那选校方面我比较纠结，CMU 和 Stanford 我有机会吗？', timestamp: '2026-04-05T09:04:00Z' },
    { role: 'assistant', content: '坦率说，CMU SCS 和 Stanford MSCS 录取率都在 5% 以下，你的 GPA 3.6 偏低（他们平均 3.8+）。但也不是没机会——CMU 非常看重项目经历，如果暑假能进 CMU REU 或拿到一篇顶会 workshop paper，竞争力会大幅提升。Stanford 更看重"故事性"，PS 要写出独特视角。\n\n建议把它们放在冲刺档，同时认真选好匹配校。我开一个「选校策略」节点来详细分析三档学校。', timestamp: '2026-04-05T09:05:00Z' },
    { role: 'user', content: '除了选校，我的背景还有什么需要补的？感觉科研经历太薄了', timestamp: '2026-04-05T09:06:00Z' },
    { role: 'assistant', content: '你敏锐地抓到了短板。CS 硕士申请中，科研经历的权重仅次于 GPA。建议三步走：\n\n1. 立刻联系本校导师看能不能进实验室，哪怕做 RA 刷一段经历\n2. 暑假申请海外 REU 或顶校的暑研项目\n3. 实习方面再补一段大厂 AI 相关的，字节和腾讯 AI Lab 都可以\n\n标化、科研、实习三线并行压力大，但时间还够。我开「背景提升」和「文书准备」两个节点来分别细化。', timestamp: '2026-04-05T09:07:00Z' },
  ],
  's2-school': [
    { role: 'user', content: '详细说说选校怎么分层？', timestamp: '2026-04-05T10:00:00Z' },
    { role: 'assistant', content: '按冲刺/匹配/保底三档，综合排名、方向匹配度、地理和奖学金来分。你的 GPA 3.6 在 Top 10 偏低，Top 20-40 竞争力较强。具体我开三个子节点来逐档分析。', timestamp: '2026-04-05T10:01:00Z' },
  ],
  's2-bg': [
    { role: 'user', content: '背景提升的优先级怎么排？', timestamp: '2026-04-05T11:00:00Z' },
    { role: 'assistant', content: '对你的情况来说：科研 > 实习 > 标化刷分。科研是最大短板也是最大杠杆，一篇 workshop paper 比 GRE 多 5 分有用得多。三条线我分别开子节点展开。', timestamp: '2026-04-05T11:01:00Z' },
  ],
  's2-doc': [
    { role: 'user', content: '文书什么时候开始准备？有什么注意事项？', timestamp: '2026-04-05T12:00:00Z' },
    { role: 'assistant', content: '9 月开始写初稿，10 月迭代定稿。最重要的是 PS 的叙事主线——不要写成简历复述，要讲一个"从 A 到 B 的认知转变故事"，引用你科研和实习的经历串联起来。', timestamp: '2026-04-05T12:01:00Z' },
  ],
  's2-timeline': [
    { role: 'user', content: '整体时间线怎么安排？怕赶不上', timestamp: '2026-04-05T13:00:00Z' },
    { role: 'assistant', content: '来得及但需要紧凑执行。注意秋季申请和春季备选的节奏差异——我开两个子节点对比两种路径。', timestamp: '2026-04-05T13:01:00Z' },
  ],
  // ── Space 3: 金融知识体系构建 ──
  's3-main': [
    { role: 'user', content: '我是计算机背景，最近对投资理财很感兴趣，但感觉金融知识太碎片化了，想系统学一下', timestamp: '2026-04-04T09:00:00Z' },
    { role: 'assistant', content: '计算机背景学金融其实有天然优势——你有数学基础和编程能力，量化分析这块上手会很快。不过金融知识确实是一张庞大的网，如果一上来就看 K 线图或者研究个股，很容易迷失。\n\n建议自顶向下搭框架：先理解宏观经济怎么运转，再看资本市场结构，然后学投资策略，最后了解风险管理。你主要是想自己投资，还是想往量化方向发展？', timestamp: '2026-04-04T09:01:00Z' },
    { role: 'user', content: '主要是想自己投资，不过量化策略我也很好奇，毕竟会写代码', timestamp: '2026-04-04T09:02:00Z' },
    { role: 'assistant', content: '那太合适了！你可以两条腿走路：传统的价值投资帮你建立商业分析的直觉，量化策略让你用数据验证和执行投资决策。两者其实不矛盾，很多顶级基金（桥水、文艺复兴）都是融合的。\n\n不过在跳进策略之前，得先打好基础。你了解 GDP、通胀、利率这些宏观指标吗？比如美联储加息对股市意味着什么？', timestamp: '2026-04-04T09:03:00Z' },
    { role: 'user', content: '大概知道加息股市跌，降息股市涨？但为什么我不太清楚', timestamp: '2026-04-04T09:04:00Z' },
    { role: 'assistant', content: '这个直觉基本对但不完全准确。核心逻辑是：利率影响"钱的成本"。加息 → 借钱更贵 → 企业融资成本上升 → 未来盈利折现值降低 → 股价承压。但实际更复杂——如果加息是因为经济过热，企业盈利本身在增长，股市未必跌。\n\n这就是为什么要先学宏观经济再看市场——不理解因果关系，只记结论容易被"这次不一样"打脸。建议我们开四条探索线：宏观经济基础、资本市场结构、投资策略方法论、风险管理。', timestamp: '2026-04-04T09:05:00Z' },
    { role: 'user', content: '行，那就按这个框架来。对了，我之前买过几只基金亏了不少，也想搞清楚到底哪里出了问题', timestamp: '2026-04-04T09:06:00Z' },
    { role: 'assistant', content: '亏钱是最好的学费，前提是你能从中提取教训。大部分散户亏钱的原因就那几个：追涨杀跌（情绪驱动）、不分散（all in 单一赛道）、忽视风险管理（只想收益不想亏损）。\n\n等我们学到「投资策略」和「风险管理」的时候，你可以把当时的买卖记录拿出来复盘，用学到的框架分析到底是策略问题还是执行问题。现在先从宏观经济开始打地基。', timestamp: '2026-04-04T09:07:00Z' },
  ],
  's3-macro': [
    { role: 'user', content: '宏观经济最核心的几个概念是什么？', timestamp: '2026-04-04T10:00:00Z' },
    { role: 'assistant', content: 'GDP、通胀率、利率——这三个是"宏观三角"，理解它们的联动关系就等于掌握了经济运行的底层逻辑。后面的货币政策、经济周期、汇率都是从这三个衍生出来的。', timestamp: '2026-04-04T10:01:00Z' },
  ],
  's3-market': [
    { role: 'user', content: '宏观打完底子了，资本市场怎么学？', timestamp: '2026-04-04T14:00:00Z' },
    { role: 'assistant', content: '资本市场就三大块：股票、债券、衍生品。它们的风险收益特征不同，相互关联。理解这三块就知道"钱都流向哪里、为什么"。我分三个子节点展开。', timestamp: '2026-04-04T14:01:00Z' },
  ],
  's3-invest': [
    { role: 'user', content: '投资策略有哪些流派？', timestamp: '2026-04-05T09:00:00Z' },
    { role: 'assistant', content: '简化来看就两大范式：价值投资（靠判断力）和量化策略（靠算法）。资产配置是连接两者的桥梁。你有编程背景，两边都可以学。', timestamp: '2026-04-05T09:01:00Z' },
  ],
  's3-risk': [
    { role: 'user', content: '风险管理听起来很枯燥，真的有必要学吗？', timestamp: '2026-04-05T14:00:00Z' },
    { role: 'assistant', content: '投资圈有句话："收益是运气，风控才是能力。" 你之前买基金亏钱，很可能不是选错了标的，而是没有风险管理意识——比如没设止损、没有做分散、仓位过重。这块必须认真学。', timestamp: '2026-04-05T14:01:00Z' },
  ],
  // ── Space 4: 高二生物·必修三 ──
  's4-main': [
    { role: 'user', content: '下周期中考试考必修三，内容太多了根本记不住，帮我梳理一下重点', timestamp: '2026-04-03T19:00:00Z' },
    { role: 'assistant', content: '别慌，必修三虽然内容多，但核心就一个主题——"生命系统怎么保持稳定"。整本书围绕这个展开，理解了这条主线，零散的知识点就能串起来。\n\n你觉得哪部分最头疼？是神经调节那块还是生态系统？', timestamp: '2026-04-03T19:01:00Z' },
    { role: 'user', content: '神经调节和体液调节老搞混，还有免疫那块也记不清。生态系统相对好一些', timestamp: '2026-04-03T19:02:00Z' },
    { role: 'assistant', content: '搞混是正常的，因为神经调节和体液调节本来就是协同工作的！教材把它们分开讲反而容易让人觉得是两个独立的东西。\n\n一个快速记忆口诀：**神经管"快"、体液管"久"、免疫管"防"**。比如手碰到热水缩回来（神经，毫秒级），甲状腺激素调节代谢（体液，小时级），打疫苗产生抗体（免疫，天级）。它们三个合在一起维持内环境稳态。\n\n我建议分三大板块来梳理：稳态与调节（神经+体液+免疫）、生态系统、种群与群落。', timestamp: '2026-04-03T19:03:00Z' },
    { role: 'user', content: '好，先从最头疼的稳态与调节开始吧。反射弧那块我知道五个部分，但总是搞不清兴奋怎么传导的', timestamp: '2026-04-03T19:04:00Z' },
    { role: 'assistant', content: '反射弧五部分你记住了就好：感受器→传入神经→神经中枢→传出神经→效应器。兴奋传导其实就两种方式：\n\n1. **神经纤维上**：电信号，像多米诺骨牌一样沿着神经传，速度超快，双向传导\n2. **突触处**：化学信号，前膜释放神经递质→穿过突触间隙→后膜接收，只能单向\n\n考试最爱考的就是突触那块——"为什么突触传递是单向的？"因为只有突触前膜能释放神经递质，突触后膜上才有受体。记住这个逻辑比死背结论有用。\n\n我开「神经调节」子节点把这块细化，然后体液和免疫也各开一条线。', timestamp: '2026-04-03T19:05:00Z' },
    { role: 'user', content: '生态系统那块感觉知识点不难但很杂，能量流动、物质循环、信息传递，总感觉分不清', timestamp: '2026-04-03T19:06:00Z' },
    { role: 'assistant', content: '其实它们三个是同一件事的三个面！想象一个森林生态系统：\n\n- **能量流动**：太阳能→草→兔→狐，单向流动、逐级递减（每级只传 10-20%）\n- **物质循环**：碳从 CO₂→草（光合）→兔（吃）→微生物（分解）→CO₂，循环往复\n- **信息传递**：花的颜色吸引蜜蜂（物理信息）、狼的尿液标记领地（化学信息）\n\n能量是"流"的（不循环），物质是"转"的（循环），信息是"传"的（调节前两者）。考试常考"比较能量流动和物质循环的异同"，抓住"单向vs循环"这个核心就不会错。\n\n我也开「生态系统」和「种群与群落」两个节点来分别梳理。', timestamp: '2026-04-03T19:07:00Z' },
  ],
  's4-homeostasis': [
    { role: 'user', content: '稳态与调节这块还有什么常考的？', timestamp: '2026-04-03T20:00:00Z' },
    { role: 'assistant', content: '血糖调节和反馈调节是大题常客。神经、体液、免疫三种调节的比较也经常出选择题。我分三个子节点来逐个击破。', timestamp: '2026-04-03T20:01:00Z' },
  ],
  's4-ecosystem': [
    { role: 'user', content: '生态系统这块重点是啥？', timestamp: '2026-04-04T19:00:00Z' },
    { role: 'assistant', content: '能量流动的计算题是必考的——给你营养级的同化量让你算传递效率。物质循环重点是碳循环的图。信息传递相对简单但别忽略。', timestamp: '2026-04-04T19:01:00Z' },
  ],
  's4-population': [
    { role: 'user', content: '种群和群落这块呢？', timestamp: '2026-04-05T19:00:00Z' },
    { role: 'assistant', content: 'J 型和 S 型增长曲线的对比是重点，K/2 是最大增长速率点。群落演替考大题概率高——初生演替和次生演替的区别要能举例说明。', timestamp: '2026-04-05T19:01:00Z' },
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
  { id: 'pub-1', spaceId: 'sp-1', label: 'MindKit 产品构建', description: '多线程探索 AI 产品的 UX、后端、AI 能力', tags: ['AUTO', '产品'], forks: 12, publishedAt: '2026-04-07T12:00:00Z' },
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
    { id: 'prod-3', type: '选校清单', title: '美国 CS 硕士选校清单', summary: '冲刺/匹配/保底三档共 9 所学校，含录取率、截止日期和匹配度分析', sourceNodeIds: ['s2-school', 's2-school-reach', 's2-school-match', 's2-school-safe'], content: '# 选校清单\n\n## 冲刺校\nCMU SCS / Stanford MSCS / MIT EECS\n\n## 匹配校\nUIUC MCS / UMich CSE / GaTech MSCS\n\n## 保底校\nNEU Align / NYU Tandon / USC CS37', createdAt: '2026-04-05T16:00:00Z', updatedAt: '2026-04-09T10:00:00Z' },
    { id: 'prod-3b', type: '时间线规划', title: '2026 秋季申请时间线', summary: '7 月-次年 4 月完整申请节奏，标化/文书/提交三线并行', sourceNodeIds: ['s2-timeline', 's2-timeline-fall', 's2-bg-test'], content: '# 申请时间线\n\n7-8月 标化出分\n9-10月 文书定稿\n11月 EA提交\n12-1月 RD批量提交\n2-4月 面试+择校', createdAt: '2026-04-06T12:00:00Z', updatedAt: '2026-04-09T11:00:00Z' },
  ],
  'sp-3': [
    { id: 'prod-4', type: '知识图谱', title: '金融知识体系导图', summary: '从宏观经济到风险管理的四层知识架构，含核心概念和关联关系', sourceNodeIds: ['s3-main', 's3-macro', 's3-market', 's3-invest', 's3-risk'], content: '# 金融知识体系\n\n## L1 宏观经济\nGDP / 通胀 / 利率\n\n## L2 资本市场\n股票 / 债券 / 衍生品\n\n## L3 投资策略\n价值投资 / 量化策略 / 资产配置\n\n## L4 风险管理\nVaR / 夏普比率 / 对冲', createdAt: '2026-04-04T16:00:00Z', updatedAt: '2026-04-09T09:00:00Z' },
    { id: 'prod-5', type: '投资框架', title: '个人投资决策框架', summary: '基于经济周期的资产配置策略 + 风险控制规则', sourceNodeIds: ['s3-invest-asset', 's3-macro-cycle', 's3-risk-measure'], content: '# 投资框架\n\n## 美林时钟\n衰退买债 / 复苏买股 / 过热买商品 / 滞胀持现金\n\n## 风控规则\n单仓 <15% / 止损 -8% / 夏普 >1.5', createdAt: '2026-04-05T16:00:00Z', updatedAt: '2026-04-09T09:30:00Z' },
  ],
  'sp-4': [
    { id: 'prod-6', type: '知识梳理', title: '必修三核心知识点速查', summary: '三大调节+生态系统+种群群落，覆盖期中考试全部重点', sourceNodeIds: ['s4-homeostasis', 's4-ecosystem', 's4-population'], content: '# 必修三速查\n\n## 稳态与调节\n神经调节：反射弧→突触传递\n体液调节：负反馈→血糖调节\n免疫调节：非特异性+特异性\n\n## 生态系统\n能量流动（单向递减10-20%）\n物质循环（碳循环）\n\n## 种群与群落\nJ型/S型增长 K值', createdAt: '2026-04-03T22:00:00Z', updatedAt: '2026-04-09T08:00:00Z' },
    { id: 'prod-7', type: '易错点总结', title: '必修三高频易错题归纳', summary: '突触传递方向性、反馈调节判断、能量传递效率计算等 12 个易错点', sourceNodeIds: ['s4-nerve-synapse', 's4-hormone-feedback', 's4-eco-energy'], content: '# 易错点\n\n1. 突触传递是单向的（前膜→后膜）\n2. 负反馈≠负调节\n3. 同化量≠摄入量\n4. K/2时增长速率最大\n5. 初生演替从裸岩开始', createdAt: '2026-04-05T20:00:00Z', updatedAt: '2026-04-09T08:00:00Z' },
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
    { id: 'evt-20', type: 'node_created', description: '创建留学规划总览节点', nodeId: 's2-main', timestamp: '2026-04-05T09:00:00Z' },
    { id: 'evt-21', type: 'node_created', description: '话题分裂：选校策略（冲刺/匹配/保底三档）', nodeId: 's2-school', timestamp: '2026-04-05T10:00:00Z' },
    { id: 'evt-22', type: 'node_created', description: '话题分裂：背景提升规划', nodeId: 's2-bg', timestamp: '2026-04-05T11:00:00Z' },
    { id: 'evt-23', type: 'node_created', description: '话题分裂：文书准备', nodeId: 's2-doc', timestamp: '2026-04-05T12:00:00Z' },
    { id: 'evt-24', type: 'cross_node_link', description: '发现关联：标化考试分数直接影响冲刺校的可行性', nodeId: 's2-bg-test', relatedNodeIds: ['s2-school-reach'], timestamp: '2026-04-05T11:30:00Z' },
    { id: 'evt-25', type: 'cross_node_link', description: '发现关联：CV 优化需引用科研经历的产出数据', nodeId: 's2-doc-cv', relatedNodeIds: ['s2-bg-research'], timestamp: '2026-04-05T12:30:00Z' },
    { id: 'evt-26', type: 'insight_generated', description: '全局洞察：秋季申请时间线与标化出分时间存在冲突风险', nodeId: 's2-main', relatedNodeIds: ['s2-timeline-fall', 's2-bg-test'], timestamp: '2026-04-05T13:30:00Z' },
    { id: 'evt-27', type: 'product_created', description: '产物生成：美国 CS 硕士选校清单', nodeId: 's2-school', timestamp: '2026-04-05T16:00:00Z' },
    { id: 'evt-28', type: 'product_created', description: '产物生成：2026 秋季申请时间线', nodeId: 's2-timeline', timestamp: '2026-04-06T12:00:00Z' },
  ],
  'sp-3': [
    { id: 'evt-30', type: 'node_created', description: '创建金融认知框架节点', nodeId: 's3-main', timestamp: '2026-04-04T09:00:00Z' },
    { id: 'evt-31', type: 'node_created', description: '话题分裂：宏观经济基础', nodeId: 's3-macro', timestamp: '2026-04-04T10:00:00Z' },
    { id: 'evt-32', type: 'node_created', description: '话题分裂：资本市场结构', nodeId: 's3-market', timestamp: '2026-04-04T14:00:00Z' },
    { id: 'evt-33', type: 'cross_node_link', description: '发现关联：资本市场分析依赖宏观经济的利率和周期框架', nodeId: 's3-market', relatedNodeIds: ['s3-macro'], timestamp: '2026-04-04T14:10:00Z' },
    { id: 'evt-34', type: 'cross_node_link', description: '发现矛盾：价值投资的"长期持有"与量化策略的"频繁交易"理念冲突', nodeId: 's3-invest-quant', relatedNodeIds: ['s3-invest-value'], timestamp: '2026-04-05T09:30:00Z' },
    { id: 'evt-35', type: 'insight_generated', description: '全局洞察：资产配置（美林时钟）是连接经济周期和投资策略的桥梁', nodeId: 's3-main', relatedNodeIds: ['s3-macro-cycle', 's3-invest-asset'], timestamp: '2026-04-05T10:00:00Z' },
    { id: 'evt-36', type: 'cross_node_link', description: '发现关联：对冲策略直接使用衍生品工具', nodeId: 's3-risk-hedge', relatedNodeIds: ['s3-market-deriv'], timestamp: '2026-04-05T14:30:00Z' },
    { id: 'evt-37', type: 'product_created', description: '产物生成：金融知识体系导图', nodeId: 's3-main', timestamp: '2026-04-04T16:00:00Z' },
    { id: 'evt-38', type: 'product_created', description: '产物生成：个人投资决策框架', nodeId: 's3-invest', timestamp: '2026-04-05T16:00:00Z' },
  ],
  'sp-4': [
    { id: 'evt-40', type: 'node_created', description: '创建必修三总览节点', nodeId: 's4-main', timestamp: '2026-04-03T19:00:00Z' },
    { id: 'evt-41', type: 'node_created', description: '话题分裂：稳态与调节（三大调节方式）', nodeId: 's4-homeostasis', timestamp: '2026-04-03T20:00:00Z' },
    { id: 'evt-42', type: 'node_created', description: '话题分裂：生态系统', nodeId: 's4-ecosystem', timestamp: '2026-04-04T19:00:00Z' },
    { id: 'evt-43', type: 'node_created', description: '话题分裂：种群与群落', nodeId: 's4-population', timestamp: '2026-04-05T19:00:00Z' },
    { id: 'evt-44', type: 'cross_node_link', description: '发现关联：体液调节与神经调节协同维持稳态', nodeId: 's4-hormone', relatedNodeIds: ['s4-nerve'], timestamp: '2026-04-03T20:30:00Z' },
    { id: 'evt-45', type: 'cross_node_link', description: '发现关联：生态系统信息传递的生物学基础来自神经调节', nodeId: 's4-eco-info', relatedNodeIds: ['s4-nerve'], timestamp: '2026-04-04T19:30:00Z' },
    { id: 'evt-46', type: 'insight_generated', description: '全局洞察：能量流动与物质循环同时进行但特征相反——能量单向、物质循环', nodeId: 's4-main', relatedNodeIds: ['s4-eco-energy', 's4-eco-matter'], timestamp: '2026-04-04T20:00:00Z' },
    { id: 'evt-47', type: 'insight_generated', description: '全局洞察：竞争排斥原理与 S 型增长的 K 值概念存在理论张力', nodeId: 's4-main', relatedNodeIds: ['s4-pop-relation', 's4-pop-growth'], timestamp: '2026-04-05T19:30:00Z' },
    { id: 'evt-48', type: 'product_created', description: '产物生成：必修三核心知识点速查', nodeId: 's4-main', timestamp: '2026-04-03T22:00:00Z' },
    { id: 'evt-49', type: 'product_created', description: '产物生成：必修三高频易错题归纳', nodeId: 's4-main', timestamp: '2026-04-05T20:00:00Z' },
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
    { id: 'ins-20', content: '「标化考试」的 GRE 出分时间如果晚于 8 月，会直接挤压「秋季申请节奏」的文书迭代周期', sourceNodeIds: ['s2-bg-test', 's2-timeline-fall'], sourceLabels: ['标化考试', '秋季申请节奏'], timestamp: '2026-04-05T13:30:00Z' },
    { id: 'ins-21', content: '「CV 优化」的量化成果依赖「科研经历」的产出——实验室进展直接影响文书质量', sourceNodeIds: ['s2-doc-cv', 's2-bg-research'], sourceLabels: ['CV 优化', '科研经历'], timestamp: '2026-04-05T12:30:00Z' },
    { id: 'ins-22', content: '「春季备选方案」和「秋季申请节奏」在时间和精力分配上存在冲突，建议秋季全力冲刺', sourceNodeIds: ['s2-timeline-spring', 's2-timeline-fall'], sourceLabels: ['春季备选方案', '秋季申请节奏'], timestamp: '2026-04-06T10:00:00Z' },
  ],
  'sp-3': [
    { id: 'ins-30', content: '「资产配置」是连接「经济周期」和具体投资操作的桥梁——美林时钟框架可以指导大类资产轮动', sourceNodeIds: ['s3-invest-asset', 's3-macro-cycle'], sourceLabels: ['资产配置', '经济周期'], timestamp: '2026-04-05T10:00:00Z' },
    { id: 'ins-31', content: '「价值投资」的长期持有理念与「量化策略」的频繁交易存在根本性冲突，但两者可在不同仓位层级共存', sourceNodeIds: ['s3-invest-value', 's3-invest-quant'], sourceLabels: ['价值投资', '量化策略'], timestamp: '2026-04-05T09:30:00Z' },
    { id: 'ins-32', content: '「对冲策略」直接依赖「衍生品」工具——不理解期权定价就无法设计有效的对冲方案', sourceNodeIds: ['s3-risk-hedge', 's3-market-deriv'], sourceLabels: ['对冲策略', '衍生品'], timestamp: '2026-04-05T14:30:00Z' },
    { id: 'ins-33', content: '「债券市场」与「股票市场」的负相关性是资产配置的基石——跌市中债券提供缓冲', sourceNodeIds: ['s3-market-bond', 's3-market-stock'], sourceLabels: ['债券市场', '股票市场'], timestamp: '2026-04-04T15:00:00Z' },
  ],
  'sp-4': [
    { id: 'ins-40', content: '「体液调节」与「神经调节」不是独立系统而是协同网络——下丘脑既是神经中枢又是内分泌器官', sourceNodeIds: ['s4-hormone', 's4-nerve'], sourceLabels: ['体液调节', '神经调节'], timestamp: '2026-04-03T20:30:00Z' },
    { id: 'ins-41', content: '「能量流动」单向递减而「物质循环」往复循环——两者同时进行但特征恰好相反，是高频对比考点', sourceNodeIds: ['s4-eco-energy', 's4-eco-matter'], sourceLabels: ['能量流动', '物质循环'], timestamp: '2026-04-04T20:00:00Z' },
    { id: 'ins-42', content: '「生态系统信息传递」的生物学基础来自「神经调节」——个体水平和群体水平的知识在此交汇', sourceNodeIds: ['s4-eco-info', 's4-nerve'], sourceLabels: ['信息传递', '神经调节'], timestamp: '2026-04-04T19:30:00Z' },
    { id: 'ins-43', content: '「种间关系」中的竞争排斥与「种群增长模型」的 K 值假设存在张力——竞争会改变 K 值本身', sourceNodeIds: ['s4-pop-relation', 's4-pop-growth'], sourceLabels: ['种间关系', '种群增长模型'], timestamp: '2026-04-05T19:30:00Z' },
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
