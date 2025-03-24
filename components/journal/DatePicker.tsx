"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date: Date
  setDate: (date: Date) => void
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  // Format date for display and input
  const formattedDate = format(date, "yyyy-MM-dd")
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      // Parse the YYYY-MM-DD format into a Date object
      const newDate = new Date(value)
      setDate(newDate)
    }
  }
  
  return (
    <div className="space-y-1">
      <div className="relative w-full">
        <Input
          type="date"
          value={formattedDate}
          onChange={handleChange}
          className={cn(
            "w-full pl-3 pr-10",
            "dark:[color-scheme:dark] focus-visible:ring-1 focus-visible:ring-offset-1",
            "appearance-none bg-background"
          )}
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      <p className="text-xs text-muted-foreground">
        {format(date, "MMMM d, yyyy")}
      </p>
    </div>
  )
} 