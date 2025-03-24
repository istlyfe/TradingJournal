"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as ReactDOM from "react-dom"

interface PortalDatePickerProps {
  date: Date
  setDate: (date: Date) => void
}

export function PortalDatePicker({ date, setDate }: PortalDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const calendarRef = React.useRef<HTMLDivElement>(null)
  
  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCalendarOpen &&
        buttonRef.current &&
        calendarRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCalendarOpen])
  
  // Calculate position when calendar opens
  React.useEffect(() => {
    if (isCalendarOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      
      // Adjust position to ensure it stays in viewport
      const windowHeight = window.innerHeight
      const calendarHeight = 300 // Approximate height
      
      let topPosition = rect.bottom + window.scrollY + 8
      
      // If calendar would go below viewport, position it above the button
      if (topPosition + calendarHeight > windowHeight + window.scrollY) {
        topPosition = rect.top + window.scrollY - calendarHeight - 8
      }
      
      setPosition({
        top: topPosition,
        left: rect.left + window.scrollX
      })
    }
  }, [isCalendarOpen])
  
  return (
    <>
      <Button
        ref={buttonRef}
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
      
      {isCalendarOpen && typeof window !== "undefined" && 
        ReactDOM.createPortal(
          <div 
            className="fixed z-[999999] animate-in fade-in zoom-in-95 duration-100" 
            style={{ top: position.top, left: position.left }}
            ref={calendarRef}
          >
            <div className="rounded-md border bg-background shadow-lg p-2">
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
                showOutsideDays={true}
                className="rounded-md"
              />
            </div>
          </div>,
          document.body
        )
      }
    </>
  )
} 