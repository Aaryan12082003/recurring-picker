'use client';

import { useEffect, useMemo, useState } from 'react';
import { RRule } from 'rrule';
import ModernCalendar from './ModernCalendar';
import { useHydratedEventStore, CalendarEvent } from '../store/eventStore';

const RecurringPicker = () => {
  // Local form state
  const [formData, setFormData] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    frequency: RRule.DAILY,
    interval: 1,
    count: '',
    byweekday: [] as number[],
    description: '',
  });

  // Zustand state
  const {
    events,
    addEvent,
    calendarSettings,
    updateCalendarSettings,
    getUpcomingEvents,
    getEventsForDate,
    _hasHydrated
  } = useHydratedEventStore();

  // Only show content after hydration
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-amber-800">Loading...</div>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents(5);

  // Update form data
  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      frequency: RRule.DAILY,
      interval: 1,
      count: '',
      byweekday: [],
      description: '',
    });
  };

  // Generate upcoming occurrences for display
  const upcomingOccurrences = useMemo(() => {
    const allOccurrences: Date[] = [];
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    events.forEach(event => {
      try {
        const occurrences = event.rrule.between(now, nextMonth, true);
        allOccurrences.push(...occurrences);
      } catch (error) {
        console.warn('Error getting occurrences:', error);
      }
    });

    return allOccurrences.sort((a, b) => a.getTime() - b.getTime());
  }, [events]);

  // Memoized calendar events for better performance
  const calendarEvents = useMemo(() => {
    return upcomingOccurrences.map(date => ({
      date,
      title: 'Event'
    }));
  }, [upcomingOccurrences]);

  const handleCalendarDateClick = (date: Date) => {
    // Find events on this date
    const eventsOnDate = getEventsForDate(date);
    if (eventsOnDate.length > 0) {
      console.log(`${eventsOnDate.length} event(s) on ${date.toLocaleDateString()}`);
    }
    updateCalendarSettings({ selectedDate: date });
  };

  // Create a new recurring event
  const createEvent = () => {
    if (!formData.title || !formData.startDate) return;

    const startDate = new Date(formData.startDate);
    
    const rrule = new RRule({
      freq: formData.frequency,
      interval: typeof formData.interval === 'string' ? (formData.interval === '' ? 1 : parseInt(formData.interval)) : formData.interval,
      count: typeof formData.count === 'string' ? (formData.count === '' ? 1 : parseInt(formData.count)) : formData.count,
      dtstart: startDate,
      byweekday: formData.byweekday.length > 0 ? formData.byweekday.map((day: number) => 
        day === 0 ? RRule.MO : 
        day === 1 ? RRule.TU :
        day === 2 ? RRule.WE :
        day === 3 ? RRule.TH :
        day === 4 ? RRule.FR :
        day === 5 ? RRule.SA :
        RRule.SU
      ) : undefined
    });

    const event: Omit<CalendarEvent, 'id'> = {
      title: formData.title,
      startDate,
      rrule,
      description: formData.description,
      color: '#f59e0b' // Default amber color
    };

    addEvent(event);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">
            ReCall - Recurring Events
          </h1>
          <p className="text-amber-700">
            Create and manage your recurring events with ease
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Creation Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-amber-200">
            <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
              <span className="mr-3">📅</span>
              Create New Event
            </h2>
            
            <div className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-white/70 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                  placeholder="Enter event title..."
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateForm('startDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-white/70 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => updateForm('frequency', parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-white/70 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200 cursor-pointer"
                >
                  <option value={RRule.DAILY}>Daily</option>
                  <option value={RRule.WEEKLY}>Weekly</option>
                  <option value={RRule.MONTHLY}>Monthly</option>
                  <option value={RRule.YEARLY}>Yearly</option>
                </select>
              </div>

              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Interval (every X periods)
                </label>
                <input
                  type="number"
                  value={formData.interval}
                  onChange={(e) => updateForm('interval', e.target.value === '' ? '' : parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-white/70 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                  placeholder="1"
                />
              </div>

              {/* Count */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Number of Occurrences (optional)
                </label>
                <input
                  type="number"
                  value={formData.count}
                  onChange={(e) => updateForm('count', e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-white/70 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Days of Week (for weekly events) */}
              {formData.frequency === RRule.WEEKLY && (
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = formData.byweekday.includes(index)
                            ? formData.byweekday.filter(d => d !== index)
                            : [...formData.byweekday, index];
                          updateForm('byweekday', newDays);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                          formData.byweekday.includes(index)
                            ? 'bg-amber-400 text-white shadow-md'
                            : 'bg-white/70 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-white/70 text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Event description..."
                />
              </div>

              {/* Create Button */}
              <button
                onClick={createEvent}
                disabled={!formData.title || !formData.startDate}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">✨</span>
                  Create Event
                </span>
              </button>
            </div>
          </div>

          {/* Calendar and Events Display */}
          <div className="space-y-6">
            {/* Modern Calendar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-amber-200">
              <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                <span className="mr-3">🗓️</span>
                Calendar
              </h2>
              <ModernCalendar
                selectedDate={calendarSettings.selectedDate}
                onDateClick={handleCalendarDateClick}
                events={calendarEvents}
                className="w-full"
              />
            </div>

            {/* Events List */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-amber-200">
              <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                <span className="mr-3">📋</span>
                Your Events ({events.length})
              </h2>
              
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-amber-600 text-lg">No events created yet</p>
                  <p className="text-amber-500 text-sm mt-2">
                    Create your first recurring event above!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 text-lg">
                            {event.title}
                          </h3>
                          <p className="text-amber-700 text-sm mt-1">
                            {event.rrule.toText()}
                          </p>
                          <p className="text-amber-600 text-xs mt-2">
                            Starts: {event.startDate.toLocaleDateString()}
                          </p>
                          {event.description && (
                            <p className="text-amber-600 text-sm mt-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Occurrences */}
            {upcomingOccurrences.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-amber-200">
                <h2 className="text-2xl font-semibold text-amber-900 mb-6 flex items-center">
                  <span className="mr-3">⏰</span>
                  Upcoming Occurrences
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {upcomingOccurrences.slice(0, 10).map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200"
                    >
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-3"></div>
                      <span className="text-amber-900 font-medium">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringPicker;
