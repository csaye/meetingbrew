// converts given hex color to rgb object
function hexToRgb(hex: string) {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) throw 'invalid hex length';
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

// find number between t*100 percent to b from a
function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}

// find percentage of distance to b that t is from a, b > a
function progress(a: number, b: number, t: number) {
  const distance = b - a;
  return (t - a) / distance;
}

function newColor(color1: string, color2: string, lBound: number, uBound: number, point: number) {
  const r = lerp(hexToRgb(color1).r, hexToRgb(color2).r, progress(lBound, uBound, point))
  const g = lerp(hexToRgb(color1).g, hexToRgb(color2).g, progress(lBound, uBound, point))
  const b = lerp(hexToRgb(color1).b, hexToRgb(color2).b, progress(lBound, uBound, point))
  return { r, g, b }
}

/**
 * Sample heatmap gradient
 * @param points n number of shades needed (for n people)
 * @param theme defaults to true for light theme
 * @returns array of n+1 shades (0 is nobody available, n is everyone available)
 */
export function sampleGradient(points: number, theme: boolean = true) {

  if (points === 1) {
    return [{ r: 224, g: 244, b: 244 }, { r: 249, g: 54, b: 54 }]
  }

  let levels = [];
  levels.push(0);
  for (let i = 0; i < points; i++) {
    levels.push((i) / (points - 1) || 0);
  }
  console.log(levels)

  const colors = levels.map((x) => {
    // find which two colors it should lerp between
    if (x < 0.33)
      return newColor('#FFFBD6', '#FFDE69', 0, 0.33, x)
    else if (x < 0.69)
      return newColor('#FFDE69', '#FF9636', 0.33, 0.69, x)
    else if (x < 0.82)
      return newColor('#FF9636', '#FD7836', 0.69, 0.82, x)
    else
      return newColor('#FD7836', '#F93636', 0.82, 1, x)
  })

  colors[0] = hexToRgb('#E0E0E0')


  return colors
}


console.log(sampleGradient(0))
