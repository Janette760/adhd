import { useState, useCallback, useEffect, useRef } from 'react'
import { organizeThoughts, getEncouragement } from '../services/api'
import type { Task } from '../services/api'
import { useSpeech } from '../hooks/useSpeech'
import { useDevice } from '../hooks/useDevice'
import { addTask, completeTask, incrementStarts, createSession, completeSessionTask } from '../db'
import { OttoPet } from '../components/OttoPet'

type Phase = 'input' | 'tasks' | 'countdown' | 'timing_waiting' | 'timing' | 'encouraging'

const COUNTDOWN = [
  { text: '5', bg: 'linear-gradient(135deg,#FDE68A,#FEF3C7)', color: '#92400E' },
  { text: '4', bg: 'linear-gradient(135deg,#FDBA74,#FED7AA)', color: '#9A3412' },
  { text: '3', bg: 'linear-gradient(135deg,#F9A8D4,#FCE7F3)', color: '#9D174D' },
  { text: '2', bg: 'linear-gradient(135deg,#93C5FD,#DBEAFE)', color: '#1E3A8A' },
  { text: '1', bg: 'linear-gradient(135deg,#86EFAC,#DCFCE7)', color: '#14532D' },
  { text: '开始！', bg: 'linear-gradient(135deg,#A7F3D0,#D1FAE5)', color: '#065F46' },
]

const NEXT_MSGS = ['太棒了！接下来试试这个～', '做得好！下一个也难不倒你 ✨', '继续加油，你比想象中更强 💪', '状态正佳！再来一个吧 🔥']
const FINAL_MSGS = [
  '🎊 天呐你太厉害了！！所有任务都完成了！\n今天的你简直无敌，每一分钟都在认真对待自己。',
  '🏆 全员通关！！！\n看看今天完成了多少事——你把一团乱麻变成了一项项成就。',
  '🎉 哇哇哇全做完了！！\n你知道最难的是什么吗？是开始。而你已经做到最后了。',
]

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

export function MainPage() {
  const [phase, setPhase]       = useState<Phase>('input')
  const [text, setText]         = useState('')
  const [tasks, setTasks]       = useState<Task[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading]   = useState(false)
  const [taskId, setTaskId]     = useState<number | null>(null)
  const [elapsed, setElapsed]   = useState(0)
  const [error, setError]       = useState<string | null>(null)
  const [sessionId, setSessionId]       = useState<number | null>(null)
  const [doneCount, setDoneCount]       = useState(0)
  const [encourage, setEncourage]       = useState<{ message: string; points: number } | null>(null)
  const [allDone, setAllDone]           = useState<string | null>(null)
  const [cdStep, setCdStep]             = useState(0)

  const elapsedRef              = useRef(0)
  const timerRef                = useRef<number | null>(null)
  const handleCompleteRef       = useRef<(s: number) => Promise<void>>(async () => {})
  const selectedTaskRef         = useRef<Task | null>(null)
  const taskIdRef               = useRef<number | null>(null)

  const { recording, transcribing, streamingText, startRecording, stopRecording } = useSpeech()

  useEffect(() => { if (recording) setText(streamingText) }, [recording, streamingText])

  function startTimer() {
    elapsedRef.current = 0; setElapsed(0)
    timerRef.current = window.setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current) }, 1000)
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }
  useEffect(() => () => stopTimer(), [])

  const onStartSignal = useCallback(() => { startTimer(); setPhase('timing') }, [])
  const onStopSignal  = useCallback(() => { stopTimer(); handleCompleteRef.current(elapsedRef.current) }, [])
  const { connected, sendPlayMusic, simulateStart, simulateStop } = useDevice({ onStartSignal, onStopSignal })

  useEffect(() => { if (selected !== null && tasks[selected]) selectedTaskRef.current = tasks[selected] }, [selected, tasks])
  useEffect(() => { taskIdRef.current = taskId }, [taskId])

  async function handleOrganize() {
    if (!text.trim()) return
    setError(null); setLoading(true)
    try {
      const result = await organizeThoughts(text)
      if (!result?.length) { setError('AI 没有返回有效任务，请重新输入'); return }
      const sid = await createSession(text, result)
      setSessionId(sid)
      setTasks(result.map((t, i) => ({ ...t, sessionIndex: i })))
      setSelected(null); setDoneCount(0); setPhase('tasks')
    } catch (e: any) {
      setError(e?.message || '整理失败，请重试')
    } finally { setLoading(false) }
  }

  async function handleStart() {
    if (selected === null) return
    const task = tasks[selected]
    const id = await addTask({ category_id: 1, content: task.content, started_at: Date.now() })
    await incrementStarts()
    setTaskId(id); setError(null); setCdStep(0); setPhase('countdown')
  }

  // countdown stepper
  useEffect(() => {
    if (phase !== 'countdown') return
    if (cdStep >= COUNTDOWN.length) { sendPlayMusic(); setPhase('timing_waiting'); return }
    const t = setTimeout(() => setCdStep(s => s + 1), 1000)
    return () => clearTimeout(t)
  }, [phase, cdStep, sendPlayMusic])

  async function handleComplete(seconds: number) {
    setElapsed(seconds)
    const task = selectedTaskRef.current
    if (task && selected !== null) {
      setTasks(prev => prev.filter((_, i) => i !== selected))
      if (sessionId !== null && task.sessionIndex !== undefined) completeSessionTask(sessionId, task.sessionIndex, seconds)
      setDoneCount(prev => prev + 1); setSelected(null)
    }
    setPhase('encouraging')
    if (taskIdRef.current !== null) await completeTask(taskIdRef.current, seconds)
    if (task) {
      const msg = await getEncouragement(task.content, seconds)
      setEncourage({ message: msg, points: Math.floor(seconds / 60) + 10 })
    }
  }
  handleCompleteRef.current = handleComplete

  function handleContinue() {
    setEncourage(null)
    if (tasks.length > 0) { setSelected(null); setPhase('tasks') }
    else { setAllDone(FINAL_MSGS[Math.floor(Math.random() * FINAL_MSGS.length)]); setPhase('encouraging') }
  }

  function reset() {
    stopTimer(); setPhase('input'); setText(''); setTasks([]); setSelected(null)
    setEncourage(null); setTaskId(null); setError(null); setDoneCount(0)
    setAllDone(null); setSessionId(null)
  }

  const selectedTask = selected !== null && tasks[selected] ? tasks[selected] : null
  const totalCount   = doneCount + tasks.length
  const isTiming     = phase === 'timing'

  // ── 倒计时全屏 ──────────────────────────────────────────
  if (phase === 'countdown') {
    const cd = COUNTDOWN[Math.min(cdStep, COUNTDOWN.length - 1)]
    return (
      <div style={{ position:'fixed', inset:0, background:cd.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32 }}>
        <div style={{ background:'rgba(255,255,255,0.7)', borderRadius:16, padding:'18px 32px', fontSize:18, fontWeight:600, color:'#1a1a1a', maxWidth:480, textAlign:'center', backdropFilter:'blur(4px)' }}>
          {selectedTask?.content}
        </div>
        <div key={cdStep} style={{ fontSize:140, fontWeight:800, color:cd.color, lineHeight:1, animation:'popIn 0.35s ease-out' }}>
          {cd.text}
        </div>
        <style>{`@keyframes popIn{from{transform:scale(1.4);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      </div>
    )
  }

  // ── 鼓励全屏 ─────────────────────────────────────────────
  if (allDone) {
    return (
      <div style={{ position:'fixed', inset:0, background:'linear-gradient(135deg,#fbc8dc,#fecdd3,#fee2e2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:28, padding:48 }}>
        <OttoPet mood="happy" size={100} />
        <p style={{ fontSize:28, fontWeight:800, color:'#9f1239' }}>全部完成！🏆</p>
        <div style={{ background:'rgba(255,255,255,0.8)', borderRadius:20, padding:'24px 32px', maxWidth:520, textAlign:'center', backdropFilter:'blur(6px)' }}>
          <p style={{ fontSize:16, lineHeight:1.85, color:'#1a1a1a', whiteSpace:'pre-line' }}>{allDone}</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize:16, padding:'14px 36px' }} onClick={reset}>🌟 回到首页</button>
      </div>
    )
  }

  if (encourage) {
    return (
      <div style={{ position:'fixed', inset:0, background:'linear-gradient(135deg,#fbc8dc,#fecdd3,#fee2e2)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, padding:48 }}>
        <OttoPet mood="happy" size={100} />
        <p style={{ fontSize:26, fontWeight:800, color:'#9f1239' }}>DONE！🎉</p>
        <div style={{ background:'rgba(255,255,255,0.82)', borderRadius:20, padding:'24px 32px', maxWidth:520, textAlign:'center', backdropFilter:'blur(6px)' }}>
          <p style={{ fontSize:16, lineHeight:1.8, color:'#1a1a1a' }}>{encourage.message}</p>
          <p style={{ fontSize:20, fontWeight:700, color:'#be185d', marginTop:12 }}>+{encourage.points} 🌊</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize:16, padding:'14px 36px' }} onClick={handleContinue}>
          {tasks.length > 0 ? '继续冲！🚀' : '收下，回首页'}
        </button>
      </div>
    )
  }

  if (phase === 'encouraging') {
    return (
      <div style={{ position:'fixed', inset:0, background:'linear-gradient(135deg,#fbc8dc,#fecdd3,#fee2e2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <OttoPet mood="happy" size={80} />
      </div>
    )
  }

  // ── 专注页（横屏三栏）──────────────────────────────────────
  if (phase === 'timing_waiting' || phase === 'timing') {
    return (
      <div style={{ position:'fixed', inset:0, background:'linear-gradient(135deg,#A7F3D0,#D1FAE5)', display:'flex', alignItems:'stretch' }}>

        {/* 左栏：任务信息 */}
        <div style={{ width:'30%', padding:'40px 32px', display:'flex', flexDirection:'column', justifyContent:'center', gap:20, borderRight:'1px solid rgba(255,255,255,0.4)' }}>
          <p style={{ fontSize:12, color:'#065f46', opacity:0.7 }}>正在做（第 {doneCount+1} 步 / 共 {totalCount} 步）</p>
          <p style={{ fontSize:22, fontWeight:700, color:'#022c22', lineHeight:1.5 }}>{selectedTask?.content}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
            <span style={{ fontSize:14, color:'#065f46' }}>♪ 专注音乐·雨声</span>
            <span style={{ fontSize:14, color:'#065f46' }}>🌊 已积累 {doneCount} 滴</span>
          </div>
        </div>

        {/* 中栏：计时器 */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
          <span style={{ background:'rgba(255,255,255,0.7)', borderRadius:999, padding:'6px 20px', fontSize:14, fontWeight:600, color:'#065f46' }}>
            {isTiming ? '专注中' : '准备中…'}
          </span>
          {isTiming ? (
            <div style={{ fontSize:120, fontWeight:800, letterSpacing:-4, color:'#022c22', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
              {fmt(elapsed)}
            </div>
          ) : (
            <div style={{ fontSize:72, lineHeight:1 }}>🎵</div>
          )}
          <p style={{ fontSize:14, color:'#065f46', opacity:0.75 }}>
            {isTiming ? '正在专注中…' : '音乐已响起，随时可以开始'}
          </p>
        </div>

        {/* 右栏：Otto + 操作 */}
        <div style={{ width:'28%', padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, borderLeft:'1px solid rgba(255,255,255,0.4)' }}>
          <OttoPet mood="neutral" size={88} />
          <p style={{ fontSize:13, color:'#065f46', opacity:0.8 }}>Otto 和你一起专注</p>
          {connected ? (
            <div style={{ background:'rgba(255,255,255,0.5)', borderRadius:16, padding:'20px 24px', textAlign:'center', backdropFilter:'blur(4px)', width:'100%' }}>
              <p style={{ fontSize:15, fontWeight:600, color:'#022c22' }}>{isTiming ? '轻拍设备结束专注' : '轻拍设备开始专注'}</p>
              <p style={{ fontSize:12, color:'#065f46', opacity:0.65, marginTop:6 }}>设备已连接，等待指令</p>
            </div>
          ) : (
            <button onClick={isTiming ? simulateStop : simulateStart} style={{ width:'100%', background:'rgba(255,255,255,0.85)', borderRadius:16, padding:'20px 24px', cursor:'pointer', border:'none', boxShadow:'0 2px 12px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize:15, fontWeight:700, color:'#022c22' }}>{isTiming ? '标记完成' : '开始计时'}</p>
              <p style={{ fontSize:12, color:'#065f46', opacity:0.65, marginTop:4 }}>未连接设备时手动操作</p>
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── 主界面（横屏两栏）──────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* 左侧面板 */}
      <div style={{
        width: phase === 'tasks' ? '55%' : '50%',
        background: phase === 'input'
          ? 'linear-gradient(180deg,#FCCB8A 0%,rgb(240,219,180) 48%,#FEF3D8 80%,#fff 100%)'
          : '#fff',
        display:'flex', flexDirection:'column',
        padding: phase === 'input' ? '48px 48px 32px' : '32px 32px 24px',
        overflow:'hidden',
        transition:'width 0.3s ease',
      }}>

        {phase === 'input' && (
          <>
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:24, maxWidth:520 }}>
              <h1 style={{ fontSize:32, fontWeight:800, color:'#1a1a1a', lineHeight:1.2 }}>现在想做点什么？</h1>
              <p style={{ fontSize:15, color:'rgba(0,0,0,0.5)' }}>说一句就好，不用想清楚</p>
              {error && (
                <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#dc2626', fontSize:13 }}>
                  ⚠️ {error}
                </div>
              )}
              <textarea
                placeholder="准备周五的小组汇报…"
                value={text}
                onChange={e => setText(e.target.value)}
                readOnly={recording}
                style={{ minHeight:160, fontSize:16 }}
              />
              <div style={{ display:'flex', gap:12 }}>
                <button
                  className={`btn btn-ghost ${recording ? 'recording' : ''}`}
                  style={{ flex:1, background: recording ? '#fee2e2' : undefined, color: recording ? '#dc2626' : undefined }}
                  onPointerDown={startRecording}
                  onPointerUp={() => stopRecording()}
                  onPointerCancel={() => stopRecording()}
                >
                  {recording ? '🔴 录音中' : transcribing ? '⏳ 转换中' : '🎙️ 说话'}
                </button>
                <button className="btn btn-primary" style={{ flex:2 }} onClick={handleOrganize} disabled={loading || !text.trim()}>
                  {loading ? '整理中…' : '整理思绪 ✨'}
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'tasks' && (
          <>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontSize:20, fontWeight:700 }}>
                {doneCount > 0 ? NEXT_MSGS[(doneCount-1) % NEXT_MSGS.length] : '我帮你整理好了最易执行的清单 ✨'}
              </h2>
              {doneCount > 0 && (
                <p style={{ fontSize:14, color:'var(--muted)', marginTop:4 }}>已完成 {doneCount}/{totalCount}，继续加油～</p>
              )}
            </div>
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, paddingRight:4 }}>
              {tasks.map((t, i) => (
                <div
                  key={t.sessionIndex ?? i}
                  className={`sticky ${selected === i ? 'selected' : ''}`}
                  onClick={() => setSelected(i)}
                >
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--orange)', minWidth:20 }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize:15, fontWeight:500, color:'#1a1a1a', lineHeight:1.4 }}>{t.content}</p>
                      {t.estimatedMinutes && (
                        <p style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>⏱ 约 {t.estimatedMinutes} 分钟</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, marginTop:16 }}>
              <button className="btn btn-ghost" onClick={() => setPhase('input')}>← {doneCount > 0 ? '返回首页' : '重写'}</button>
            </div>
          </>
        )}
      </div>

      {/* 右侧面板 */}
      <div style={{
        flex:1,
        background:'#fff',
        borderLeft:'1px solid rgba(0,0,0,0.06)',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'48px 40px',
        gap:24,
      }}>

        {phase === 'input' && (
          <>
            <div className={`pill ${connected ? 'connected' : ''}`} style={{ alignSelf:'flex-end', marginBottom:'auto' }}>
              <span>{connected ? '●' : '○'}</span>
              {connected ? '设备已连接' : '等待设备'}
            </div>
            <OttoPet mood="neutral" size={120} />
            <div style={{ textAlign:'center', maxWidth:320 }}>
              <p style={{ fontSize:17, fontWeight:600, color:'#1a1a1a', marginBottom:8 }}>Hi，我是 Otto 👋</p>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7 }}>
                把脑子里乱糟糟的想法倒给我，<br />我帮你拆成能做的小步骤。
              </p>
            </div>
          </>
        )}

        {phase === 'tasks' && (
          <>
            <div className={`pill ${connected ? 'connected' : ''}`} style={{ alignSelf:'flex-end', marginBottom:'auto' }}>
              <span>{connected ? '●' : '○'}</span>
              {connected ? '设备已连接' : '等待设备'}
            </div>
            {selectedTask ? (
              <div style={{ width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:20, animation:'fadeIn 0.25s ease' }}>
                <OttoPet mood="neutral" size={72} />
                <div className="card">
                  <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>已选择任务</p>
                  <p style={{ fontSize:18, fontWeight:700, lineHeight:1.4 }}>{selectedTask.content}</p>
                  {selectedTask.estimatedMinutes && (
                    <p style={{ fontSize:13, color:'var(--muted)', marginTop:8 }}>⏱ 预计 {selectedTask.estimatedMinutes} 分钟</p>
                  )}
                </div>
                <button className="btn btn-primary" style={{ fontSize:16, padding:'14px', width:'100%' }} onClick={handleStart}>
                  🚀 开始这个！
                </button>
              </div>
            ) : (
              <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                <OttoPet mood="neutral" size={88} />
                <p style={{ fontSize:15, color:'var(--muted)' }}>← 从左边选一个任务开始吧</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
