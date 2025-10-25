"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MobileColumnSelectorProps {
  columns: { id: string; label: string }[]
  selectedColumn: string
  onColumnChange: (columnId: string) => void
}

export function MobileColumnSelector({ columns, selectedColumn, onColumnChange }: MobileColumnSelectorProps) {
  return (
    <div className="md:hidden mb-4">
      <Select value={selectedColumn} onValueChange={onColumnChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          {columns.map((col) => (
            <SelectItem key={col.id} value={col.id}>
              {col.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
