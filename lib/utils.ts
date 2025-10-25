import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
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

export function getQuarterStart(date: Date): Date {
  const d = new Date(date)
  const month = d.getMonth()
  const quarterStartMonth = Math.floor(month / 3) * 3
  return new Date(d.getFullYear(), quarterStartMonth, 1)
}

export function formatQuarterStart(date: Date): string {
  const quarterStart = getQuarterStart(date)
  const year = quarterStart.getFullYear()
  const month = String(quarterStart.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

export function addQuarters(date: Date, quarters: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + quarters * 3)
  return result
}

export function formatQuarterLabel(date: Date): string {
  const quarterStart = getQuarterStart(date)
  const month = quarterStart.getMonth()
  const quarter = Math.floor(month / 3) + 1
  const year = quarterStart.getFullYear()
  return `Q${quarter} ${year}`
}

export function isDateInQuarter(dateString: string | null | undefined, quarterStart: string): boolean {
  if (!dateString) return false

  try {
    const date = new Date(dateString)
    const [qYear, qMonth] = quarterStart.split("-").map(Number)
    const quarterStartDate = new Date(qYear, qMonth - 1, 1)
    const quarterEndDate = new Date(qYear, qMonth + 2, 0) // Last day of quarter

    return date >= quarterStartDate && date <= quarterEndDate
  } catch {
    return false
  }
}
