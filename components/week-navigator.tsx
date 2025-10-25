"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface WeekNavigatorProps {
  weekLabel: string
  onPreviousWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
}

export function WeekNavigator({ weekLabel, onPreviousWeek, onNextWeek, onCurrentWeek }: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 px-2 md:px-4 py-1.5">
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onPreviousWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-xs md:text-sm font-medium whitespace-nowrap">{weekLabel}</span>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="link" size="sm" className="h-auto p-0 text-xs md:text-sm shrink-0" onClick={onCurrentWeek}>
        Today
      </Button>
    </div>
  )
}
