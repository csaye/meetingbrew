import { CSSObjectWithLabel } from 'react-select'

// returns class name built with given style data
export function styleBuilder(styles: (string | [string, boolean])[]) {
  const usedStyles: string[] = []
  for (const style of styles) {
    if (typeof style === 'string') usedStyles.push(style)
    else if (style[1]) usedStyles.push(style[0])
  }
  return usedStyles.join(' ')
}

// styles applied to react select component
export const selectStyles = {
  control: (baseStyles: CSSObjectWithLabel, state: { isFocused: boolean }) => ({
    ...baseStyles,
    height: '48px',
    borderRadius: 0,
    background: 'var(--dark-white)',
    borderWidth: '1px',
    borderColor: state.isFocused ? 'var(--gray)' : 'var(--mid-gray)',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'var(--gray)',
    },
  }),
  menu: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    borderRadius: 0,
  }),
  menuList: (baseStyles: CSSObjectWithLabel) => ({
    ...baseStyles,
    padding: 0,
  }),
  option: (
    baseStyles: CSSObjectWithLabel,
    state: { isSelected: boolean; isFocused: boolean }
  ) => ({
    ...baseStyles,
    backgroundColor: 'var(--white)',
    background: state.isSelected
      ? 'var(--mb-red)'
      : state.isFocused
      ? 'rgba(250, 56, 56, 0.2)'
      : undefined,
    '&:active': {
      background: 'rgba(250, 56, 56, 0.33)',
    },
  }),
}
