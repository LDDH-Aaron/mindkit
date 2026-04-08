import { Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/Home'
import { Workspace } from './pages/Workspace'

export function App() {
  return (
    <Routes>
      {/* 首次进入带 ?new 播放纸团动画 */}
      <Route path="/" element={<Navigate to="/space/sp-1?new" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/space/:spaceId" element={<Workspace />} />
      <Route path="*" element={<Navigate to="/space/sp-1" replace />} />
    </Routes>
  )
}
