/** Three-free so the UI can draw the face without pulling in the engine. */
type Paint = (x: number, y: number, w: number, h: number, c: string) => void

export function painter(size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rect: Paint = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h) }
  const speckle = (x: number, y: number, w: number, h: number, colors: string[], seed: number) => {
    let s = seed
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      s = (s * 9301 + 49297) % 233280
      rect(i, j, 1, 1, colors[Math.floor((s / 233280) * colors.length)])
    }
  }
  return { canvas, rect, speckle }
}

/** An original default-style skin: brown hair, teal shirt, indigo jeans. */
export function paintSkin() {
  const { canvas, rect, speckle } = painter()
  const hair = ['#3b2614', '#46301b', '#33200f']
  const skin = ['#c99a74', '#c39370', '#cfa27c']
  const shirt = ['#1f9e9e', '#22a8a8', '#1b9090']
  const jeans = ['#3a3f9a', '#353a90', '#4046a6']
  // head
  speckle(0, 0, 32, 16, skin, 1)
  speckle(8, 0, 8, 8, hair, 2)
  speckle(0, 8, 8, 3, hair, 3); speckle(16, 8, 8, 3, hair, 4); speckle(24, 8, 8, 6, hair, 5)
  speckle(8, 8, 8, 2, hair, 6)
  rect(8, 10, 1, 1, '#3b2614'); rect(15, 10, 1, 1, '#3b2614')
  rect(9, 12, 1, 1, '#ffffff'); rect(10, 12, 1, 1, '#4a3a8a'); rect(13, 12, 1, 1, '#4a3a8a'); rect(14, 12, 1, 1, '#ffffff')
  rect(11, 13, 2, 1, '#a8775a')
  rect(10, 14, 4, 1, '#7e4c3a')
  rect(9, 15, 6, 1, '#b58566')
  // body
  speckle(16, 16, 24, 16, shirt, 7)
  rect(23, 20, 2, 1, '#c99a74'); rect(24, 21, 1, 1, '#c99a74')
  // arms: sleeves then skin
  speckle(40, 16, 16, 16, skin, 8)
  speckle(40, 16, 16, 8, shirt, 9)
  // legs: jeans then shoes
  speckle(0, 16, 16, 16, jeans, 10)
  speckle(0, 29, 16, 3, ['#5a5a5a', '#4e4e4e', '#666666'], 11)
  return canvas
}

