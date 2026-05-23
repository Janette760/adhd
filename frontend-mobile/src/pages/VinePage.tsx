import { useEffect, useState } from 'react'
import { getAllSessions, type TaskSession } from '../db'

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

export function VinePage() {
  const [sessions, setSessions] = useState<TaskSession[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    getAllSessions().then(setSessions)
  }, [])

  if (sessions.length === 0) {
    return (
      <div style={{ padding: '0 16px' }}>
        <h1 className="page-header" style={{ padding: '20px 0 16px' }}>任务历史</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0', color: 'rgba(0,0,0,0.35)' }}>
          <div style={{ fontSize: 48 }}>📋</div>
          <p style={{ fontSize: 15, textAlign: 'center', lineHeight: 1.7 }}>
            还没有任务记录<br />
            去整理一次思绪吧～
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <h1 className="page-header" style={{ padding: '20px 0 16px' }}>任务历史</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sessions.map(session => {
          const id = session.id!
          const doneCount = session.tasks.filter(t => t.done).length
          const total = session.tasks.length
          const isExpanded = expanded === id
          const allDone = doneCount === total

          return (
            <div key={id} style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              border: allDone ? '1.5px solid #6ee7b7' : '1.5px solid transparent',
            }}>
              {/* 卡片头部 */}
              <div
                style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                onClick={() => setExpanded(isExpanded ? null : id)}
              >
                {/* 完成状态圆圈 */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: allDone ? '#d1fae5' : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, marginTop: 2,
                }}>
                  {allDone ? '✓' : `${doneCount}/${total}`}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 原始输入 */}
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.input_text}
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{timeAgo(session.created_at)}</span>
                    {allDone && <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>全部完成</span>}
                  </div>
                </div>

                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.3)', marginTop: 4, flexShrink: 0 }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>

              {/* 展开的任务列表 */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '8px 16px 14px' }}>
                  {session.tasks.map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 0',
                      borderBottom: i < session.tasks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}>
                      {/* 完成状态图标 */}
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
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)' }}>
                            预计 {t.estimatedMinutes} 分钟
                          </span>
                          {t.done && t.durationSeconds && (
                            <span style={{ fontSize: 12, color: '#059669' }}>
                              实际 {fmt(t.durationSeconds)}
                            </span>
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
    </div>
  )
}
