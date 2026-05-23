import { useState, useEffect } from 'react'

const OTTER_COUNT = 5
const NATURAL_W   = 1252
const NATURAL_H   = 392
// width of one otter in the sprite (pixels)
const OTTER_W     = NATURAL_W / OTTER_COUNT  // 250.4

const DISPLAY_MS  = 2200
const FADE_MS     = 400

export function OtterCarousel({ size = 100 }: { size?: number }) {
  // size = display height; width keeps natural otter aspect ratio
  const displayW = Math.round(size * (OTTER_W / NATURAL_H))

  const [index, setIndex]   = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % OTTER_COUNT)
        setVisible(true)
      }, FADE_MS)
    }, DISPLAY_MS + FADE_MS)
    return () => clearInterval(id)
  }, [])

  // When img height = size (px), rendered width = size * (NATURAL_W / NATURAL_H)
  // Each otter slice = size * (OTTER_W / NATURAL_H) = displayW  ✓
  return (
    <div style={{
      width: displayW,
      height: size,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      <img
        src="/otter.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          height: '100%',
          width: 'auto',
          left: -index * displayW,
          top: 0,
          // white / light card backgrounds blend away into the orange gradient
          mixBlendMode: 'multiply',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
