import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === "string") {
      classes.push(input)
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return twMerge(classes.join(" "))
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

export function formatWeekStart(date: Date): string {
  const weekStart = getWeekStart(date)

  // Use local date formatting instead of toISOString() to avoid timezone issues
  const year = weekStart.getFullYear()
  const month = String(weekStart.getMonth() + 1).padStart(2, "0")
  const day = String(weekStart.getDate()).padStart(2, "0")
  const result = `${year}-${month}-${day}`

  return result
}

export function parseDateLocal(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4) // Friday

  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${weekStart.toLocaleDateString("en-US", options)} - ${weekEnd.toLocaleDateString("en-US", options)}`
}

export function extractDate(dateValue: string | null | undefined): string | null {
  if (!dateValue) return null
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}

export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const quarter = Math.ceil(month / 3)
  return { year: now.getFullYear(), quarter }
}

export function formatQuarter(year: number, quarter: number): string {
  return `Q${quarter} ${year}`
}

export function addQuarters(year: number, quarter: number, offset: number): { year: number; quarter: number } {
  let newQuarter = quarter + offset
  let newYear = year

  while (newQuarter > 4) {
    newQuarter -= 4
    newYear += 1
  }

  while (newQuarter < 1) {
    newQuarter += 4
    newYear -= 1
  }

  return { year: newYear, quarter: newQuarter }
}
