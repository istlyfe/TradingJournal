"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InlineDatePickerProps {
  date: Date
  setDate: (date: Date) => void
}

export function InlineDatePicker({ date, setDate }: InlineDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground"
        )}
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : "Select a date"}
      </Button>
      
      {isCalendarOpen && (
        <div className="mt-2 rounded-md border bg-background shadow-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                setDate(newDate)
                setIsCalendarOpen(false)
              }
            }}
            initialFocus
            className="rounded-md"
          />
        </div>
      )}
    </div>
  )
} 