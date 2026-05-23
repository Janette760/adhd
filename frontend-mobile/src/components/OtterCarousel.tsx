import { useState, useEffect } from 'react'

const OTTER_COUNT = 5
const DISPLAY_MS = 2200
const FADE_MS = 400

export function OtterCarousel({ size = 100 }: { size?: number }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % OTTER_COUNT)
        setVisible(true)
      }, FADE_MS)
    }, DISPLAY_MS + FADE_MS)
    return () => clearInterval(timer)
  }, [])

  // sprite: 5 otters in one row; background-position 0%→100% in 4 steps
  const bgX = index === 0 ? '0%' : `${(index / (OTTER_COUNT - 1)) * 100}%`

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: 'url(/otter.png)',
        backgroundSize: `${OTTER_COUNT * 100}% auto`,
        backgroundPosition: `${bgX} center`,
        backgroundRepeat: 'no-repeat',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        flexShrink: 0,
      }}
    />
  )
}
