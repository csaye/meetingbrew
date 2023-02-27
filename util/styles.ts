// returns class name built with given style data
export function styleBuilder(styles: (string | [string, boolean])[]) {
  const usedStyles: string[] = [];
  for (const style of styles) {
    if (typeof style === 'string') usedStyles.push(style);
    else if (style[1]) usedStyles.push(style[0]);
  }
  return usedStyles.join(' ');
}
