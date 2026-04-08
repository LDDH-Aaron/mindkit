import { useState, useEffect } from 'react'
import { FileText, Download, Clock, GitBranch } from 'lucide-react'
import { getProducts, type Product } from '../lib/api'

interface ProductViewProps {
  spaceId: string
}

export function ProductView({ spaceId }: ProductViewProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProducts(spaceId)
      .then(({ products }) => setProducts(products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [spaceId])

  const handFont = { fontFamily: 'var(--font-hand)' }
  const handAlt = { fontFamily: 'var(--font-hand-alt)' }
  const handSm = { fontFamily: 'var(--font-hand-sm)' }

  if (selected) {
    return (
      <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(42,42,42,0.08)' }}>
          <button
            onClick={() => setSelected(null)}
            className="bg-transparent border-none cursor-pointer px-3 py-1 rounded-md hover:bg-black/5 transition-colors"
            style={{ ...handFont, fontSize: 16, color: 'var(--color-blue-pen)' }}
          >
            ← 返回列表
          </button>
          <span style={{ ...handFont, fontSize: 20, color: 'var(--color-ink)', fontWeight: 600 }}>
            {selected.title}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-4" style={{ ...handSm, fontSize: 13, color: 'var(--color-pencil)' }}>
            <span>类型: {selected.type}</span>
            <span>来源: {selected.sourceNodeIds.length} 个节点</span>
            <span>更新于 {new Date(selected.updatedAt).toLocaleString()}</span>
          </div>
          <div
            className="whitespace-pre-wrap leading-relaxed"
            style={{ ...handAlt, fontSize: 16, color: 'var(--color-ink)', lineHeight: 1.8 }}
          >
            {selected.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-paper)' }}>
      {/* 标题 */}
      <div className="px-6 pt-6 pb-4">
        <h2
          className="text-[28px] font-bold"
          style={{ ...handFont, color: 'var(--color-ink)', transform: 'rotate(-1deg)', display: 'inline-block' }}
        >
          产物列表
        </h2>
        <p style={{ ...handAlt, fontSize: 15, color: 'var(--color-pencil)', marginTop: 4 }}>
          AI 根据对话自动生成和更新的文档
        </p>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading && <p style={{ ...handAlt, fontSize: 16, color: 'var(--color-pencil)' }}>加载中...</p>}
        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText size={48} strokeWidth={1} style={{ color: 'var(--color-pencil)', marginBottom: 12 }} />
            <p style={{ ...handFont, fontSize: 20, color: 'var(--color-pencil)' }}>暂无产物</p>
            <p style={{ ...handSm, fontSize: 14, color: 'var(--color-pencil)', marginTop: 4 }}>
              对话深入后 AI 会自动提议生成
            </p>
          </div>
        )}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {products.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setSelected(prod)}
              className="p-5 rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
              style={{
                border: '1.5px solid rgba(42,42,42,0.1)',
                background: 'var(--color-paper)',
                boxShadow: '2px 2px 0 rgba(42,42,42,0.05)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} style={{ color: 'var(--color-blue-pen)' }} />
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ ...handSm, fontSize: 11, background: 'rgba(58,107,197,0.1)', color: 'var(--color-blue-pen)' }}
                >
                  {prod.type}
                </span>
              </div>
              <h3
                className="text-[18px] font-semibold mb-2"
                style={{ ...handFont, color: 'var(--color-ink)' }}
              >
                {prod.title}
              </h3>
              <p
                className="mb-3 line-clamp-2"
                style={{ ...handAlt, fontSize: 14, color: 'var(--color-ink)', lineHeight: 1.5, opacity: 0.8 }}
              >
                {prod.summary}
              </p>
              <div className="flex items-center gap-3" style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)' }}>
                <span className="flex items-center gap-1">
                  <GitBranch size={12} />
                  {prod.sourceNodeIds.length} 个节点
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(prod.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); alert('导出功能开发中') }}
                className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent border cursor-pointer transition-colors hover:bg-black/5"
                style={{ ...handSm, fontSize: 12, color: 'var(--color-pencil)', borderColor: 'rgba(42,42,42,0.12)' }}
              >
                <Download size={12} />
                导出
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
