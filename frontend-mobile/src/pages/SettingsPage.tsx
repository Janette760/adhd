import { useEffect, useState } from 'react'
import { getStats, type Stats } from '../db'
import { useBluetooth } from '../hooks/useBluetooth'

const SHOP_ITEMS = [
  { name: '手冲咖啡一杯', points: 200, emoji: '☕' },
  { name: '贴纸一套',     points: 150, emoji: '🎨' },
  { name: '休息 30 分钟', points: 100, emoji: '😴' },
  { name: '看一集剧',     points: 300, emoji: '🎬' },
]

export function SettingsPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [showShop, setShowShop] = useState(false)
  const { connected, connecting, connect } = useBluetooth(() => {})

  useEffect(() => { getStats().then(setStats) }, [])

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <h1 className="page-header" style={{ padding: '20px 0 20px' }}>设置</h1>

      {/* 蓝牙 */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>硬件连接</p>
        <button
          className={`btn ${connected ? 'btn-ghost' : 'btn-primary'}`}
          style={{ width: '100%' }}
          onClick={connect}
          disabled={connecting || connected}
        >
          {connecting ? '连接中…' : connected ? '✓ 设备已连接' : '连接 ADHD 蜂鸣器'}
        </button>
        {connected && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            轻拍设备可完成任务并获得鼓励
          </p>
        )}
      </div>

      {/* 积分 + 商城 */}
      {stats && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontWeight: 600 }}>我的积分</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--violet-light)' }}>{stats.points}</p>
          </div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => setShowShop(true)}
          >
            🛍️ 积分商城
          </button>
        </div>
      )}

      {/* 商城底部弹窗 */}
      {showShop && (
        <div className="bottom-sheet" onClick={() => setShowShop(false)}>
          <div className="bottom-sheet-inner" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 18 }}>积分商城</p>
              <button style={{ color: 'var(--text-muted)', fontSize: 20 }} onClick={() => setShowShop(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SHOP_ITEMS.map(item => (
                <div key={item.name} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                  <span style={{ fontSize: 28 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: 15 }}>{item.name}</p>
                    <p style={{ color: 'var(--violet-light)', fontSize: 13, marginTop: 2 }}>{item.points} 积分</p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    onClick={() => alert('敬请期待！')}
                  >
                    兑换
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
