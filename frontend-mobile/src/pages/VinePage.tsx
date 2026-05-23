import { useEffect, useState } from 'react'
import { getAllSessions, type TaskSession } from '../db'
import { OtterCarousel } from '../components/OtterCarousel'
import type { QuickTask } from '../App'

const CN_NUMS = ['一', '二', '三', '四', '五', '六']

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
  const [sessions, setSessions]   = useState<TaskSession[]>([])
  const [expanded, setExpanded]   = useState<number | null>(null)
  const [selected, setSelected]   = useState<QuickTask | null>(null)

  // 读灵感清单（供"建议任务"展示）
  const inspiration: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('inspiration') || '[]') } catch { return [] }
  })()

  useEffect(() => {
    getAllSessions().then(setSessions)
  }, [])

  // 近3次会话里未完成的任务，最多5条
  const suggested: QuickTask[] = []
  for (const session of sessions.slice(0, 3)) {
    for (const t of session.tasks) {
      if (!t.done && suggested.length < 5 && !suggested.some(s => s.content === t.content)) {
        suggested.push({ content: t.content, estimatedMinutes: t.estimatedMinutes })
      }
    }
  }

  // 行标签：倒数第一条（且总数≥3）标为"生活小记"，其余标"任务X"
  function rowLabel(i: number, total: number) {
    if (total >= 3 && i === total - 1) return '生活小记'
    return `任务${CN_NUMS[i] ?? i + 1}`
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 80px)', overflow: 'hidden',
      background: '#fff',
    }}>

      {/* ── 顶部水獭渐变 ───────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #FCCB8A 0%, rgb(240,219,180) 48%, #FEF3D8 80%, #f5f5f4 100%)',
        padding: '24px 24px 22px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, textAlign: 'center', flexShrink: 0,
      }}>
        <OtterCarousel size={100} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>
          让我们一起开始
        </h1>
      </div>

      {/* ── 今日计划时间表 section header ───────── */}
      <div style={{
        padding: '9px 16px 7px',
        background: '#EDECE8',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.5 }}>
          今日计划时间表
        </span>
      </div>

      {/* ── 主内容（可滚动）────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>

        {/* 建议任务列表（行列样式）*/}
        {suggested.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 10, padding: '44px 0', color: 'rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 36 }}>🎉</span>
            <p style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.8 }}>
              今日任务已全部完成！<br />去首页再整理一轮吧～
            </p>
          </div>
        ) : (
          suggested.map((task, i) => {
            const isSel = selected?.content === task.content
            const label = rowLabel(i, suggested.length)
            return (
              <div
                key={i}
                onClick={() => setSelected(isSel ? null : task)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  background: isSel ? '#FFFBEB' : i % 2 === 0 ? '#FAFAF8' : '#fff',
                  borderLeft: `3px solid ${isSel ? '#FBBF24' : 'transparent'}`,
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: isSel ? '#D97706' : 'rgba(0,0,0,0.32)',
                  minWidth: 56, flexShrink: 0,
                }}>
                  {label}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.4 }}>{task.content}</p>
                  <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.36)', marginTop: 2 }}>
                    预计 {task.estimatedMinutes} 分钟
                  </p>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSel ? '#FBBF24' : 'rgba(0,0,0,0.15)'}`,
                  background: isSel ? '#FBBF24' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}>
                  {isSel && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            )
          })
        )}

        {/* ── 历史记录（折叠在下方）───────────────── */}
        {sessions.length > 0 && (
          <>
            <div style={{ padding: '14px 20px 8px', background: '#EDECE8', marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.5 }}>
                历史记录
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 16px 16px' }}>
              {sessions.map(session => {
                const id = session.id!
                const doneCount = session.tasks.filter(t => t.done).length
                const total = session.tasks.length
                const isExpanded = expanded === id
                const allDone = doneCount === total
                return (
                  <div key={id} style={{
                    background: '#fff', borderRadius: 14,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)', overflow: 'hidden',
                    border: allDone ? '1.5px solid #6ee7b7' : '1.5px solid transparent',
                  }}>
                    <div
                      style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                      onClick={() => setExpanded(isExpanded ? null : id)}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: allDone ? '#d1fae5' : '#f3f3f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, marginTop: 1,
                      }}>
                        {allDone ? '✓' : `${doneCount}/${total}`}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 600, color: '#1a1a1a',
                          lineHeight: 1.4, marginBottom: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {session.input_text}
                        </p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{timeAgo(session.created_at)}</span>
                          {allDone && (
                            <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>
                              全部完成
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: 3, flexShrink: 0 }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '6px 16px 12px' }}>
                        {session.tasks.map((t, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
                            borderBottom: i < session.tasks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                              background: t.done ? '#059669' : 'transparent',
                              border: t.done ? 'none' : '2px solid rgba(0,0,0,0.18)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {t.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{
                                fontSize: 13, lineHeight: 1.4,
                                color: t.done ? 'rgba(0,0,0,0.38)' : '#1a1a1a',
                                textDecoration: t.done ? 'line-through' : 'none',
                              }}>
                                {t.content}
                              </p>
                              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>预计 {t.estimatedMinutes} 分钟</span>
                                {t.done && t.durationSeconds && (
                                  <span style={{ fontSize: 11, color: '#059669' }}>实际 {fmt(t.durationSeconds)}</span>
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
          </>
        )}
      </div>

      {/* ── 建议任务条 ──────────────────────────── */}
      {inspiration.length > 0 && (
        <div style={{
          padding: '10px 20px', flexShrink: 0,
          background: '#FFFBF0',
          borderTop: '1px solid rgba(251,191,36,0.22)',
        }}>
          <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600 }}>建议任务：</span>
            {inspiration[0]}
          </p>
        </div>
      )}

      {/* ── 一键启动 ────────────────────────────── */}
      <div style={{
        padding: '14px 20px 18px', flexShrink: 0,
        background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button
          onClick={() => {
            const task = selected ?? suggested[0] ?? null
            if (task) onQuickStart(task)
          }}
          disabled={suggested.length === 0}
          style={{
            flex: 1, padding: '17px',
            borderRadius: 999, border: 'none',
            background: suggested.length > 0
              ? 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)'
              : 'rgba(0,0,0,0.07)',
            color: suggested.length > 0 ? '#fff' : 'rgba(0,0,0,0.28)',
            fontSize: 17, fontWeight: 700,
            cursor: suggested.length > 0 ? 'pointer' : 'default',
            boxShadow: suggested.length > 0 ? '0 5px 20px rgba(251,191,36,0.4)' : 'none',
            transition: 'all 0.2s ease',
            letterSpacing: 0.5,
          }}
        >
          一键启动
        </button>

        {/* 线框图右侧小圆点（呼应物理设备按钮）*/}
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: 'rgba(0,0,0,0.18)',
          flexShrink: 0,
        }} />
      </div>
    </div>
  )
}
