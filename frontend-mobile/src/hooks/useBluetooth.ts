import { useState, useRef, useCallback } from 'react'

// ── UUID 需与 ESP32 固件保持一致 ─────────────────────────
const SERVICE_UUID  = '12345678-1234-1234-1234-123456789abc'
const WRITE_CHAR    = '12345678-1234-1234-1234-123456789ab1' // App → ESP32（写）
const NOTIFY_CHAR   = '12345678-1234-1234-1234-123456789ab2' // ESP32 → App（通知）

// ── 信号值定义（与 ESP32 固件约定一致）────────────────────
const CMD_PLAY_MUSIC = 0x01 // App → ESP32：播放专注音乐
const SIG_START      = 0x01 // ESP32 → App：开始计时
const SIG_STOP       = 0x02 // ESP32 → App：结束计时

interface Props {
  onStartSignal: () => void // 收到 ESP32 开始信号
  onStopSignal:  () => void // 收到 ESP32 结束信号
}

export function useBluetooth({ onStartSignal, onStopSignal }: Props) {
  const [connected, setConnected]   = useState(false)
  const [connecting, setConnecting] = useState(false)

  const writeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)

  // 始终持有最新回调，避免 stale closure
  const onStartRef = useRef(onStartSignal)
  const onStopRef  = useRef(onStopSignal)
  onStartRef.current = onStartSignal
  onStopRef.current  = onStopSignal

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

      // 写特征：App 发指令给 ESP32
      writeCharRef.current = await service.getCharacteristic(WRITE_CHAR)

      // 通知特征：接收 ESP32 发来的信号
      const notifyChar = await service.getCharacteristic(NOTIFY_CHAR)
      await notifyChar.startNotifications()

      notifyChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const char = event.target as BluetoothRemoteGATTCharacteristic
        if (!char.value) return
        const signal = char.value.getUint8(0)
        console.log('[BLE] 收到信号值:', signal)
        if (signal === SIG_START) {
          onStartRef.current()
        } else if (signal === SIG_STOP) {
          onStopRef.current()
        }
      })

      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false)
        writeCharRef.current = null
        console.log('[BLE] 设备已断开')
      })

      setConnected(true)
      console.log('[BLE] 已连接')
    } catch (e) {
      console.error('[BLE] 连接失败', e)
    } finally {
      setConnecting(false)
    }
  }, [])

  // App → ESP32：发送播放音乐指令
  const sendPlayMusic = useCallback(async () => {
    if (!writeCharRef.current) return
    await writeCharRef.current.writeValue(new Uint8Array([CMD_PLAY_MUSIC]))
    console.log('[BLE] 已发送播放音乐指令')
  }, [])

  // 未连接设备时的软件备用接口（触发相同逻辑）
  const simulateStart = useCallback(() => onStartRef.current(), [])
  const simulateStop  = useCallback(() => onStopRef.current(), [])

  return { connected, connecting, connect, sendPlayMusic, simulateStart, simulateStop }
}
