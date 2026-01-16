/**
 * Форматирует число с разделением по 3 цифры через пробел
 */
export const formatWithSpaces = (value: number | string): string => {
  return String(value || '')
    .replace(/\s/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
