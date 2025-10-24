"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface QuarterNavigatorProps {
  quarterLabel: string
  onPreviousQuarter: () => void
  onNextQuarter: () => void
  onCurrentQuarter: () => void
}

export function QuarterNavigator({
  quarterLabel,
  onPreviousQuarter,
  onNextQuarter,
  onCurrentQuarter,
}: QuarterNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 px-2 md:px-4 py-1.5">
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onPreviousQuarter}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-xs md:text-sm font-medium whitespace-nowrap">{quarterLabel}</span>

      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onNextQuarter}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs md:text-sm shrink-0"
        onClick={onCurrentQuarter}
      >
        This Quarter
      </Button>
    </div>
  )
}
