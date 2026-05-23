import { useState, useEffect } from 'react'

const IMAGES = ['/otter1.png', '/otter2.png', '/otter3.png', '/otter4.png', '/otter5.png']
const DISPLAY_MS = 4000
const FADE_MS    = 500

export function OtterCarousel({ size = 120 }: { size?: number }) {
  const [index, setIndex]   = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % IMAGES.length)
        setVisible(true)
      }, FADE_MS)
    }, DISPLAY_MS + FADE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <img
      src={IMAGES[index]}
      alt=""
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        mixBlendMode: 'multiply',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        userSelect: 'none',
        pointerEvents: 'none',
        flexShrink: 0,
      }}
    />
  )
}
