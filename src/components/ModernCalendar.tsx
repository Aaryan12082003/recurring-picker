'use client';

import { useState, useMemo, useCallback } from 'react';

interface CalendarEvent {
  date: Date;
  title?: string;
}

interface ModernCalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

const ModernCalendar = ({ events, onDateClick, selectedDate, className = '' }: ModernCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Touch/scroll state for mobile fast navigation
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [lastTouchY, setLastTouchY] = useState<number | null>(null);
  const [velocity, setVelocity] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Memoized calendar calculations for performance
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Create array of all days to display (including prev/next month days)
    const days = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    const daysFromPrevMonth = startingDayOfWeek;
    for (let i = daysFromPrevMonth; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i + 1),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Add days from current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    // Add days from next month to complete the grid
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  }, [currentMonth]);

  // Memoized events map for performance
  const eventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const dateKey = event.date.toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const navigateYear = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  }, []);

  const fastNavigate = useCallback((direction: 'prev' | 'next', amount: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - amount);
      } else {
        newDate.setMonth(prev.getMonth() + amount);
      }
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  // Touch handling for mobile fast scrolling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setLastTouchY(touch.clientY);
    setTouchStartTime(Date.now());
    setVelocity(0);
    setIsScrolling(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartY || !touchStartTime) return;
    
    e.preventDefault(); // Prevent default scrolling
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    
    // Calculate velocity (pixels per millisecond)
    if (lastTouchY !== null) {
      const timeDiff = Math.max(1, deltaTime - (touchStartTime || 0));
      const yDiff = currentY - lastTouchY;
      setVelocity(yDiff / timeDiff);
    }
    
    setLastTouchY(currentY);
    
    // Much lower threshold for ultra-responsive scrolling
    const threshold = 8;
    
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swiping down = previous month
        navigateMonth('prev');
      } else {
        // Swiping up = next month  
        navigateMonth('next');
      }
      
      // Reset touch tracking for continuous scrolling
      setTouchStartY(currentY);
      setTouchStartTime(Date.now());
    }
  }, [touchStartY, touchStartTime, lastTouchY, navigateMonth]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartY || !touchStartTime) return;
    
    const deltaTime = Date.now() - touchStartTime;
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    
    // Momentum scrolling - if it was a fast swipe, do multiple month jumps
    if (Math.abs(velocity) > 0.3 && deltaTime < 400) {
      const monthsToJump = Math.min(Math.floor(Math.abs(velocity) * 8), 12);
      if (velocity > 0) {
        fastNavigate('prev', monthsToJump);
      } else {
        fastNavigate('next', monthsToJump);
      }
    }
    
    // Reset touch state with slight delay for smoothness
    setTimeout(() => {
      setTouchStartY(null);
      setTouchStartTime(null);
      setLastTouchY(null);
      setVelocity(0);
      setIsScrolling(false);
    }, 100);
  }, [touchStartY, touchStartTime, velocity, fastNavigate]);

  // Mouse wheel handling for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const deltaY = e.deltaY;
    const threshold = 50;
    
    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        navigateMonth('next');
      } else {
        navigateMonth('prev');
      }
    }
  }, [navigateMonth]);

  const handleDateClick = useCallback((date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  }, [onDateClick]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div 
      className={`modern-calendar bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ 
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          {/* Left navigation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateYear('prev')}
              className="p-2 hover:bg-white/20 rounded-md transition-colors duration-200"
              aria-label="Previous year"
              title="Previous Year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => fastNavigate('prev', 3)}
              className="p-2 hover:bg-white/20 rounded-md transition-colors duration-200"
              aria-label="Previous 3 months"
              title="Back 3 Months"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white/20 rounded-md transition-colors duration-200"
              aria-label="Previous month"
              title="Previous Month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="text-center relative">
            <h2 className="text-xl font-bold cursor-pointer hover:text-blue-100 transition-colors duration-200" 
                onClick={goToToday}
                title="Click to go to today">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            {/* Scroll indicator */}
            {isScrolling && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right navigation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white/20 rounded-md transition-colors duration-200"
              aria-label="Next month"
              title="Next Month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => fastNavigate('next', 3)}
              className="p-2 hover:bg-white/20 rounded-md transition-colors duration-200"
              aria-label="Next 3 months"
              title="Forward 3 Months"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => navigateYear('next')}
              className="p-2 hover:bg-white/20 rounded-md transition-colors duration-200"
              aria-label="Next year"
              title="Next Year"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M3 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center mt-3 space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors duration-200"
          >
            Today
          </button>
          <button
            onClick={() => fastNavigate('prev', 6)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors duration-200"
          >
            -6M
          </button>
          <button
            onClick={() => fastNavigate('next', 6)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm transition-colors duration-200"
          >
            +6M
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {dayNames.map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Optimized for fast scrolling */}
      <div 
        className="calendar-grid grid grid-cols-7 auto-rows-fr"
        style={{ 
          height: '300px',
          contain: 'layout style paint',
          willChange: 'transform',
          opacity: isScrolling ? 0.9 : 1,
          transition: 'opacity 0.1s ease-out'
        }}
      >
        {calendarData.map((day, index) => {
          const dayEvents = eventsMap.get(day.date.toDateString()) || [];
          const hasEvents = dayEvents.length > 0;
          
          return (
            <div
              key={`${day.date.toISOString()}-${index}`}
              onClick={() => handleDateClick(day.date)}
              className={`
                relative p-2 border-r border-b last:border-r-0 cursor-pointer
                transition-colors duration-150 ease-in-out
                hover:bg-blue-50 active:bg-blue-100
                ${day.isCurrentMonth 
                  ? 'bg-white text-black' 
                  : 'bg-gray-50 text-gray-400'
                }
                ${day.isToday 
                  ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-300' 
                  : ''
                }
              `}
              style={{
                minHeight: '40px',
                transform: 'translateZ(0)', // Force GPU acceleration
              }}
            >
              {/* Date number */}
              <div className="text-sm font-medium">
                {day.date.getDate()}
              </div>
              
              {/* Event indicators */}
              {hasEvents && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="flex gap-1 justify-center">
                    {dayEvents.slice(0, 3).map((_, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                        title={`${dayEvents.length} event(s)`}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-blue-600 font-semibold ml-1">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event count summary and mobile instructions */}
      <div className="p-3 bg-gray-50 border-t text-center">
        {events.length > 0 ? (
          <div className="text-sm text-gray-600 mb-1">
            Showing {events.length} recurring event{events.length !== 1 ? 's' : ''}
          </div>
        ) : null}
        
        {/* Mobile swipe instructions */}
        <div className="text-xs text-gray-500 flex items-center justify-center space-x-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>Swipe up/down for fast month navigation</span>
        </div>
      </div>
    </div>
  );
};

export default ModernCalendar;
