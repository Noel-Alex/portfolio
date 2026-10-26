import { useCallback, useState, type ReactNode } from 'react'

export type Line = { id: number; node: ReactNode; at: number }

let lineId = 0
export function useChatLog() {
  const [lines, setLines] = useState<Line[]>([])
  const say = useCallback((node: ReactNode) => setLines(l => [...l.slice(-40), { id: ++lineId, node, at: Date.now() }]), [])
  return { lines, say }
}
