'use client'

import { useState, useMemo } from 'react'
import { RRule } from 'rrule'
import ModernCalendar from './ModernCalendar'

export default function RecurrencePlayground() {
  const [dates, setDates] = useState<Date[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Memoized calendar events for performance
  const calendarEvents = useMemo(() => {
    return dates.map(date => ({
      date,
      title: 'Mon/Wed Event'
    }));
  }, [dates]);

  const handleDateClick = (date: Date) => {
    console.log('Playground date clicked:', date.toLocaleDateString());
  };
  
  const generate = () => {
    const rule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.MO, RRule.WE],
      dtstart: new Date(),
      count: 10
    })
    setDates(rule.all())
    console.log(rule.toString())
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-800">Quick Playground</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-600 hover:text-gray-800 focus:outline-none"
        >
          {isMinimized ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>
      
      {!isMinimized && (
        <div className="p-4">
          <button 
            onClick={generate} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate Next 10 Dates (Mon & Wed)
          </button>
          
          {dates.length > 0 && (
            <div className="mt-4">
              <div className="mb-3 text-sm text-gray-600">
                Generated {dates.length} dates for Monday & Wednesday pattern
              </div>
              <ModernCalendar 
                events={calendarEvents}
                onDateClick={handleDateClick}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
