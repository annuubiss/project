/**
 * Легковесный fuzzy search для ERP
 * Поддерживает нечёткое совпадение, поиск по части строки, ранжирование результатов
 */

export type FuzzySearchOptions<T> = {
  keys: Array<keyof T | ((item: T) => string)>
  threshold?: number // 0-1, где 0 = точное совпадение, 1 = любое совпадение
  maxResults?: number
}

type SearchResult<T> = {
  item: T
  score: number
  matches: Array<{ key: string; indices: Array<[number, number]> }>
}

/**
 * Вычисляет оценку совпадения между строкой и запросом
 * Чем меньше оценка, тем лучше совпадение
 */
function calculateScore(str: string, query: string): number {
  const strLower = str.toLowerCase()
  const queryLower = query.toLowerCase()

  // Точное совпадение = высший приоритет
  if (strLower === queryLower) return 0

  // Начинается с запроса = высокий приоритет
  if (strLower.startsWith(queryLower)) return 0.1

  // Содержит запрос как подстроку = средний приоритет
  const substringIndex = strLower.indexOf(queryLower)
  if (substringIndex !== -1) {
    // Чем ближе к началу, тем лучше
    return 0.2 + substringIndex / strLower.length * 0.3
  }

  // Fuzzy match - все символы запроса встречаются в строке по порядку
  let strIndex = 0
  let queryIndex = 0
  const matches: number[] = []

  while (strIndex < strLower.length && queryIndex < queryLower.length) {
    if (strLower[strIndex] === queryLower[queryIndex]) {
      matches.push(strIndex)
      queryIndex++
    }
    strIndex++
  }

  // Если не все символы запроса найдены, совпадения нет
  if (queryIndex < queryLower.length) {
    return 1
  }

  // Оценка на основе расстояния между совпадающими символами
  let totalDistance = 0
  for (let i = 1; i < matches.length; i++) {
    totalDistance += matches[i] - matches[i - 1]
  }

  const avgDistance = totalDistance / (matches.length - 1 || 1)
  return 0.5 + Math.min(0.4, avgDistance / strLower.length)
}

/**
 * Находит индексы совпадающих символов
 */
function findMatchIndices(str: string, query: string): Array<[number, number]> {
  const strLower = str.toLowerCase()
  const queryLower = query.toLowerCase()
  const indices: Array<[number, number]> = []

  // Точное совпадение или подстрока
  const substringIndex = strLower.indexOf(queryLower)
  if (substringIndex !== -1) {
    indices.push([substringIndex, substringIndex + queryLower.length - 1])
    return indices
  }

  // Fuzzy match
  let strIndex = 0
  let queryIndex = 0
  let matchStart = -1

  while (strIndex < strLower.length && queryIndex < queryLower.length) {
    if (strLower[strIndex] === queryLower[queryIndex]) {
      if (matchStart === -1) {
        matchStart = strIndex
      }
      queryIndex++

      // Если это последний символ запроса или следующий символ не совпадает
      if (
        queryIndex === queryLower.length ||
        strIndex + 1 >= strLower.length ||
        strLower[strIndex + 1] !== queryLower[queryIndex]
      ) {
        indices.push([matchStart, strIndex])
        matchStart = -1
      }
    }
    strIndex++
  }

  return indices
}

/**
 * Выполняет fuzzy search по массиву объектов
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions<T>,
): T[] {
  const { keys, threshold = 0.6, maxResults = 100 } = options

  if (!query.trim()) {
    return []
  }

  const results: SearchResult<T>[] = []

  for (const item of items) {
    let bestScore = 1
    const matches: SearchResult<T>['matches'] = []

    for (const key of keys) {
      const value =
        typeof key === 'function'
          ? key(item)
          : String(item[key as keyof T] ?? '')

      const score = calculateScore(value, query)

      if (score < bestScore) {
        bestScore = score
      }

      if (score < threshold) {
        const indices = findMatchIndices(value, query)
        matches.push({
          key: typeof key === 'function' ? 'computed' : String(key),
          indices,
        })
      }
    }

    if (bestScore < threshold) {
      results.push({
        item,
        score: bestScore,
        matches,
      })
    }
  }

  // Сортируем по релевантности (меньше score = лучше)
  results.sort((a, b) => a.score - b.score)

  return results.slice(0, maxResults).map((result) => result.item)
}

/**
 * Специализированная версия для поиска товаров в POS
 */
export function searchProducts<
  T extends { name: string; sku: string; barcode: string },
>(products: T[], query: string, maxResults = 6): T[] {
  return fuzzySearch(products, query, {
    keys: ['name', 'sku', 'barcode'],
    threshold: 0.7,
    maxResults,
  })
}
