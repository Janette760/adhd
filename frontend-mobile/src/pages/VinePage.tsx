import { useEffect, useMemo, useState } from 'react'
import { getAllSessions, type TaskSession } from '../db'
import { OtterCarousel } from '../components/OtterCarousel'
import type { QuickTask } from '../App'

const CN_NUMS = ['一', '二', '三', '四', '五', '六']

const ENCOURAGEMENTS = [
  '现在就开始吧！',
  '选它，立刻行动！',
  '你可以的！',
  '一步一步来，先做这个！',
  '就是它了，冲！',
]

interface Props {
  onQuickStart: (task: QuickTask) => void
}

export function VinePage({ onQuickStart }: Props) {
  const [sessions, setSessions] = useState<TaskSession[]>([])
  const [selected, setSelected] = useState<QuickTask | null>(null)
  const encouragement = useMemo(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)], [])

  // 最新 session 中 AI 推荐的建议任务
  const latestSession = sessions[0]
  const recommendedTask: QuickTask | null = (() => {
    if (!latestSession || latestSession.suggestedTaskIndex === undefined) return null
    const t = latestSession.tasks[latestSession.suggestedTaskIndex]
    return t ? { content: t.content, estimatedMinutes: t.estimatedMinutes } : null
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

      </div>

      {/* ── 建议任务卡（AI 推荐最重要最紧急那条，兜底用第一条）── */}
      {(recommendedTask ?? suggested[0]) && (
        <div
          onClick={() => setSelected(recommendedTask ?? suggested[0]!)}
          style={{
            margin: '0 16px 12px', flexShrink: 0,
            background: selected?.content === (recommendedTask ?? suggested[0])?.content
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : 'linear-gradient(135deg, #FFFBF0 0%, #FEF3C7 100%)',
            border: `2px solid ${selected?.content === (recommendedTask ?? suggested[0])?.content ? '#F59E0B' : 'rgba(251,191,36,0.45)'}`,
            borderRadius: 16,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 3px 14px rgba(251,191,36,0.2)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 15 }}>⭐</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', letterSpacing: 0.5 }}>建议任务</span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#78350F', lineHeight: 1.45, marginBottom: 8 }}>
            {(recommendedTask ?? suggested[0])!.content}
          </p>
          <p style={{ fontSize: 13, color: '#D97706', fontWeight: 500 }}>
            {encouragement}
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
            borderRadius: 16, border: 'none',
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
