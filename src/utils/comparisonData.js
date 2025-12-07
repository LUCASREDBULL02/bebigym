
// Build comparison-chart style data from muscleStats and muscle definitions
import { MUSCLES } from '../data/muscles'

export function buildComparisonChartData(muscleStats) {
  if (!muscleStats || typeof muscleStats !== 'object') return []

  return MUSCLES.map((m) => {
    const s = muscleStats[m.id] || {}
    return {
      id: m.id,
      name: m.name,
      actual: typeof s.percent === 'number' ? s.percent : 0,
      levelKey: s.levelKey || 'Beginner',
    }
  })
}
