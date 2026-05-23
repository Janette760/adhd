import { useState, useRef, useCallback } from 'react'

// UUIDs 需与 ESP32 固件保持一致
const SERVICE_UUID     = '12345678-1234-1234-1234-123456789abc'
const BUZZER_CHAR_UUID = '12345678-1234-1234-1234-123456789ab1'
const TAP_CHAR_UUID    = '12345678-1234-1234-1234-123456789ab2'

interface Props {
  onFirstSignal: () => void   // ESP32 第一次信号 → 开始计时
  onSecondSignal: () => void  // ESP32 第二次信号 → 停止计时
}

export function useBluetooth({ onFirstSignal, onSecondSignal }: Props) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const buzzerRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const tapCountRef = useRef(0)
  const onFirstRef = useRef(onFirstSignal)
  const onSecondRef = useRef(onSecondSignal)
  onFirstRef.current = onFirstSignal
  onSecondRef.current = onSecondSignal

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('此浏览器不支持 Web Bluetooth，请使用 Chrome')
      return
    }
    setConnecting(true)
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ADHD-Buzzer' }],
        optionalServices: [SERVICE_UUID],
      })
      const server  = await device.gatt!.connect()
      const service = await server.getPrimaryService(SERVICE_UUID)

      buzzerRef.current = await service.getCharacteristic(BUZZER_CHAR_UUID)

      // 监听 ESP32 发来的信号
      const tapChar = await service.getCharacteristic(TAP_CHAR_UUID)
      await tapChar.startNotifications()
      tapCountRef.current = 0

      tapChar.addEventListener('characteristicvaluechanged', () => {
        tapCountRef.current += 1
        if (tapCountRef.current === 1) {
          onFirstRef.current()
        } else if (tapCountRef.current === 2) {
          onSecondRef.current()
        }
      })

      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false)
        buzzerRef.current = null
      })
      setConnected(true)
    } catch (e) {
      console.error('BLE connect failed', e)
    } finally {
      setConnecting(false)
    }
  }, [])

  // 发送"播放音乐"信号到 ESP32
  const sendMusicSignal = useCallback(async () => {
    if (!buzzerRef.current) return
    tapCountRef.current = 0 // 每次新任务重置计数
    await buzzerRef.current.writeValue(new Uint8Array([1]))
  }, [])

  // 模拟信号：无 ESP32 时用于测试
  const simulateFirstSignal = useCallback(() => {
    onFirstRef.current()
  }, [])

  const simulateSecondSignal = useCallback(() => {
    onSecondRef.current()
  }, [])

  return {
    connected,
    connecting,
    connect,
    sendMusicSignal,
    simulateFirstSignal,
    simulateSecondSignal,
  }
}
