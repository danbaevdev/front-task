/**
 * Форматирует число с разделением по 3 цифры через пробел
 */
export const formatWithSpaces = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') {
    return '0'
  }

  const stringValue = String(value).replace(/\s/g, '')

  if (!stringValue) {
    return '0'
  }

  return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
