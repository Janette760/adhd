import { useEffect, useState } from 'react'
import { getAllSessions, type TaskSession } from '../db'
import { OtterCarousel } from '../components/OtterCarousel'
import type { QuickTask } from '../App'

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return '刚刚'
  if (m < 60) return `${m} 分钟前`
  if (h < 24) return `${h} 小时前`
  return `${d} 天前`
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} 分钟` : `${s} 秒`
}

interface Props {
  onQuickStart: (task: QuickTask) => void
}

export function VinePage({ onQuickStart }: Props) {
  const [sessions, setSessions] = useState<TaskSession[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [selected, setSelected] = useState<QuickTask | null>(null)

  useEffect(() => {
    getAllSessions().then(setSessions)
  }, [])

  // Collect incomplete tasks from the 3 most recent sessions (up to 5 unique items)
  const suggested: QuickTask[] = []
  for (const session of sessions.slice(0, 3)) {
    for (const t of session.tasks) {
      if (!t.done && suggested.length < 5 && !suggested.some(s => s.content === t.content)) {
        suggested.push({ content: t.content, estimatedMinutes: t.estimatedMinutes })
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)', background: '#fff' }}>

      {/* 顶部水獭渐变区 */}
      <div style={{
        background: 'linear-gradient(180deg, #FCCB8A 0%, rgb(240,219,180) 48%, #FEF3D8 80%, #fff 100%)',
        padding: '32px 24px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
      }}>
        <OtterCarousel size={90} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginTop: 6 }}>
          {suggested.length > 0 ? '还有任务没做完～' : '今天做得很棒！'}
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.48)' }}>
          {suggested.length > 0 ? '选一个，马上开始' : '去首页继续整理思绪吧'}
        </p>
      </div>

      {/* 主内容区（底部留空给悬浮按钮）*/}
      <div style={{ flex: 1, padding: '0 16px 110px', overflowY: 'auto' }}>

        {/* 建议任务 */}
        {suggested.length > 0 && (
          <section>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.4)', padding: '20px 0 10px' }}>建议任务</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggested.map((task, i) => {
                const isSelected = selected?.content === task.content
                return (
                  <div
                    key={i}
                    onClick={() => setSelected(isSelected ? null : task)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                      background: isSelected ? '#FEF3C7' : '#fafaf8',
                      border: `1.5px solid ${isSelected ? '#FBBF24' : 'rgba(0,0,0,0.07)'}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? '#F59E0B' : 'rgba(0,0,0,0.18)'}`,
                      background: isSelected ? '#F59E0B' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.4 }}>{task.content}</p>
                      <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>预计 {task.estimatedMinutes} 分钟</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 历史记录 */}
        <section>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.4)', padding: '20px 0 10px' }}>历史记录</p>

          {sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0', color: 'rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: 40 }}>📋</span>
              <p style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.7 }}>还没有任务记录<br />去整理一次思绪吧～</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map(session => {
                const id = session.id!
                const doneCount = session.tasks.filter(t => t.done).length
                const total = session.tasks.length
                const isExpanded = expanded === id
                const allDone = doneCount === total

                return (
                  <div key={id} style={{
                    background: '#fff', borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
                    border: allDone ? '1.5px solid #6ee7b7' : '1.5px solid transparent',
                  }}>
                    <div
                      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                      onClick={() => setExpanded(isExpanded ? null : id)}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: allDone ? '#d1fae5' : 'var(--bg3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, marginTop: 2,
                      }}>
                        {allDone ? '✓' : `${doneCount}/${total}`}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.input_text}
                        </p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{timeAgo(session.created_at)}</span>
                          {allDone && (
                            <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>全部完成</span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', marginTop: 4, flexShrink: 0 }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '8px 16px 14px' }}>
                        {session.tasks.map((t, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
                            borderBottom: i < session.tasks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                              background: t.done ? '#059669' : 'transparent',
                              border: t.done ? 'none' : '2px solid rgba(0,0,0,0.18)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {t.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{
                                fontSize: 14, lineHeight: 1.4,
                                color: t.done ? 'rgba(0,0,0,0.4)' : '#1a1a1a',
                                textDecoration: t.done ? 'line-through' : 'none',
                              }}>
                                {t.content}
                              </p>
                              <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>预计 {t.estimatedMinutes} 分钟</span>
                                {t.done && t.durationSeconds && (
                                  <span style={{ fontSize: 12, color: '#059669' }}>实际 {fmt(t.durationSeconds)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* 一键专注悬浮按钮 */}
      <div style={{
        position: 'fixed', bottom: 80, left: 0, right: 0,
        padding: '16px 24px 8px',
        background: 'linear-gradient(to top, #fff 70%, transparent)',
        pointerEvents: 'auto',
      }}>
        <button
          onClick={() => selected && onQuickStart(selected)}
          disabled={!selected}
          style={{
            width: '100%', padding: '18px',
            borderRadius: 999, border: 'none',
            background: selected
              ? 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)'
              : 'rgba(0,0,0,0.07)',
            color: selected ? '#fff' : 'rgba(0,0,0,0.3)',
            fontSize: 18, fontWeight: 700,
            cursor: selected ? 'pointer' : 'default',
            boxShadow: selected ? '0 6px 24px rgba(251,191,36,0.45)' : 'none',
            transition: 'all 0.2s ease',
            letterSpacing: 1,
          }}
        >
          🚀 一键专注
        </button>
      </div>
    </div>
  )
}
