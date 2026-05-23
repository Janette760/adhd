import { useEffect, useState } from 'react'

interface Props {
  taskContent: string
  onDone: () => void
}

const SEQUENCE = [
  { text: '3', delay: 1000 },
  { text: '2', delay: 1000 },
  { text: '1', delay: 1000 },
  { text: '开始！', delay: 800 },
]

export function FullscreenCountdown({ taskContent, onDone }: Props) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= SEQUENCE.length) { onDone(); return }
    const t = setTimeout(() => setStep(s => s + 1), SEQUENCE[step].delay)
    return () => clearTimeout(t)
  }, [step, onDone])

  const current = SEQUENCE[step] ?? SEQUENCE[SEQUENCE.length - 1]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'linear-gradient(160deg, #A7F3D0 0%, #D1FAE5 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 32,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.7)',
        borderRadius: 16,
        padding: '16px 24px',
        fontSize: 17,
        fontWeight: 600,
        color: '#022c22',
        width: '80%',
        textAlign: 'center',
        backdropFilter: 'blur(4px)',
      }}>
        {taskContent}
      </div>

      <div key={step} style={{
        fontSize: 112,
        fontWeight: 800,
        color: '#059669',
        lineHeight: 1,
        animation: 'popIn 0.35s ease-out',
      }}>
        {current.text}
      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
