// converts given hex color to rgb object
function hexToRgb(hex: string) {
  if (hex.startsWith('#')) hex = hex.slice(1)
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  if (hex.length !== 6) throw 'invalid hex length'
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

// linearly interpolates between two numbers
function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t
}

// linearly interpolates between two hex colors
export function lerpColor(colorA: string, colorB: string, t: number) {
  const rgbA = hexToRgb(colorA)
  const rgbB = hexToRgb(colorB)
  const r = lerp(rgbA.r, rgbB.r, t)
  const g = lerp(rgbA.g, rgbB.g, t)
  const b = lerp(rgbA.b, rgbB.b, t)
  return `rgb(${r}, ${g}, ${b})`
}
