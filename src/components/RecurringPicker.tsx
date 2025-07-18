'use client';

import { useState, useEffect, useMemo } from 'react';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import ModernCalendar from './ModernCalendar';

interface RecurringEvent {
  id: string;
  title: string;
  startDate: Date;
  rrule: RRule;
  description?: string;
}

const RecurringPicker = () => {
  const [events, setEvents] = useState<RecurringEvent[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '',
    frequency: RRule.WEEKLY,
    interval: 1 as number | string,
    count: 10 as number | string,
    byweekday: [] as number[],
    description: ''
  });
  const [upcomingOccurrences, setUpcomingOccurrences] = useState<Date[]>([]);

  // Memoized calendar events for better performance
  const calendarEvents = useMemo(() => {
    return upcomingOccurrences.map(date => ({
      date,
      title: 'Event'
    }));
  }, [upcomingOccurrences]);

  const handleCalendarDateClick = (date: Date) => {
    // Find events on this date
    const eventsOnDate = upcomingOccurrences.filter(
      occurrence => occurrence.toDateString() === date.toDateString()
    );
    if (eventsOnDate.length > 0) {
      console.log(`${eventsOnDate.length} event(s) on ${date.toLocaleDateString()}`);
    }
  };

  // Create a new recurring event
  const createEvent = () => {
    if (!newEvent.title || !newEvent.startDate) return;

    const startDate = new Date(newEvent.startDate);
    
    const rrule = new RRule({
      freq: newEvent.frequency,
      interval: typeof newEvent.interval === 'string' ? (newEvent.interval === '' ? 1 : parseInt(newEvent.interval)) : newEvent.interval,
      count: typeof newEvent.count === 'string' ? (newEvent.count === '' ? 1 : parseInt(newEvent.count)) : newEvent.count,
      dtstart: startDate,
      byweekday: newEvent.byweekday.length > 0 ? newEvent.byweekday.map(day => 
        day === 0 ? RRule.MO : 
        day === 1 ? RRule.TU :
        day === 2 ? RRule.WE :
        day === 3 ? RRule.TH :
        day === 4 ? RRule.FR :
        day === 5 ? RRule.SA :
        RRule.SU
      ) : undefined
    });

    const event: RecurringEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      startDate,
      rrule,
      description: newEvent.description
    };

    setEvents([...events, event]);
    
    // Reset form
    setNewEvent({
      title: '',
      startDate: '',
      frequency: RRule.WEEKLY,
      interval: 1,
      count: 10,
      byweekday: [],
      description: ''
    });
  };

  // Get upcoming occurrences for all events
  useEffect(() => {
    const now = new Date();
    const allOccurrences: Date[] = [];

    events.forEach(event => {
      const occurrences = event.rrule.between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)); // Next 30 days
      allOccurrences.push(...occurrences);
    });

    allOccurrences.sort((a, b) => a.getTime() - b.getTime());
    setUpcomingOccurrences(allOccurrences.slice(0, 10)); // Show next 10 occurrences
  }, [events]);

  const handleWeekdayToggle = (weekday: number) => {
    const currentWeekdays = [...newEvent.byweekday];
    const index = currentWeekdays.indexOf(weekday);
    
    if (index > -1) {
      currentWeekdays.splice(index, 1);
    } else {
      currentWeekdays.push(weekday);
    }
    
    setNewEvent({ ...newEvent, byweekday: currentWeekdays });
  };

  const frequencyOptions = [
    { value: RRule.DAILY, label: 'Daily' },
    { value: RRule.WEEKLY, label: 'Weekly' },
    { value: RRule.MONTHLY, label: 'Monthly' },
    { value: RRule.YEARLY, label: 'Yearly' }
  ];

  const weekdays = [
    { value: RRule.MO.weekday, label: 'Mon' },
    { value: RRule.TU.weekday, label: 'Tue' },
    { value: RRule.WE.weekday, label: 'Wed' },
    { value: RRule.TH.weekday, label: 'Thu' },
    { value: RRule.FR.weekday, label: 'Fri' },
    { value: RRule.SA.weekday, label: 'Sat' },
    { value: RRule.SU.weekday, label: 'Sun' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Recurring Event</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={newEvent.startDate}
              onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={newEvent.frequency}
              onChange={(e) => setNewEvent({ ...newEvent, frequency: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interval (every X {frequencyOptions.find(f => f.value === newEvent.frequency)?.label.toLowerCase()})
            </label>
            <input
              type="number"
              min="1"
              value={newEvent.interval}
              onChange={(e) => setNewEvent({ ...newEvent, interval: e.target.value === '' ? '' : parseInt(e.target.value) })}
              onBlur={(e) => setNewEvent({ ...newEvent, interval: e.target.value === '' ? 1 : parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Occurrences
            </label>
            <input
              type="number"
              min="1"
              value={newEvent.count}
              onChange={(e) => setNewEvent({ ...newEvent, count: e.target.value === '' ? '' : parseInt(e.target.value) })}
              onBlur={(e) => setNewEvent({ ...newEvent, count: e.target.value === '' ? 1 : parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Event description"
            />
          </div>
        </div>

        {newEvent.frequency === RRule.WEEKLY && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleWeekdayToggle(day.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    newEvent.byweekday.includes(day.value)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={createEvent}
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Recurring Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Your Events</h3>
          {events.length === 0 ? (
            <p className="text-gray-500">No events created yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="border border-gray-200 rounded-md p-4">
                  <h4 className="font-semibold text-black">{event.title}</h4>
                  <p className="text-sm text-black mt-1">
                    Starts: {event.startDate.toLocaleString()}
                  </p>
                  <p className="text-sm text-black">
                    Rule: {event.rrule.toText()}
                  </p>
                  {event.description && (
                    <p className="text-sm text-black mt-1">{event.description}</p>
                  )}
                  <div className="mt-2">
                    <button
                      onClick={() => setEvents(events.filter(e => e.id !== event.id))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Event Calendar</h3>
          {upcomingOccurrences.length === 0 ? (
            <p className="text-gray-500">No upcoming events. Create an event to see it on the calendar.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-md text-center">
                  <div className="text-sm text-blue-600">Total Events</div>
                  <div className="text-lg font-semibold text-blue-800">{events.length}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-md text-center">
                  <div className="text-sm text-green-600">Total Occurrences</div>
                  <div className="text-lg font-semibold text-green-800">{upcomingOccurrences.length}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-md text-center">
                  <div className="text-sm text-purple-600">Next Event</div>
                  <div className="text-sm font-semibold text-purple-800">
                    {upcomingOccurrences.length > 0 ? upcomingOccurrences[0].toLocaleDateString() : 'None'}
                  </div>
                </div>
              </div>
              
              <ModernCalendar 
                events={calendarEvents}
                onDateClick={handleCalendarDateClick}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Common Recurrence Patterns</h3>
        <div className="space-y-6">
          <div className="border-l-4 border-blue-400 pl-4">
            <h4 className="font-semibold text-blue-800 mb-2">📅 Daily Pattern</h4>
            <p className="text-gray-700 mb-2"><strong>Example:</strong> Every day for 10 days</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Use case:</strong> Daily standup meetings, medication reminders</p>
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Technical RRule</summary>
              <code className="bg-gray-100 px-2 py-1 rounded mt-1 block font-mono text-gray-600">
                {new RRule({ freq: RRule.DAILY, count: 10, dtstart: new Date() }).toString()}
              </code>
            </details>
          </div>

          <div className="border-l-4 border-green-400 pl-4">
            <h4 className="font-semibold text-green-800 mb-2">📊 Weekly Pattern</h4>
            <p className="text-gray-700 mb-2"><strong>Example:</strong> Every week on Monday and Friday, for 5 weeks</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Use case:</strong> Team meetings, workout sessions</p>
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Technical RRule</summary>
              <code className="bg-gray-100 px-2 py-1 rounded mt-1 block font-mono text-gray-600">
                {new RRule({ freq: RRule.WEEKLY, byweekday: [RRule.MO, RRule.FR], count: 5, dtstart: new Date() }).toString()}
              </code>
            </details>
          </div>

          <div className="border-l-4 border-purple-400 pl-4">
            <h4 className="font-semibold text-purple-800 mb-2">🗓️ Monthly Pattern</h4>
            <p className="text-gray-700 mb-2"><strong>Example:</strong> Every month on the 15th, for 6 months</p>
            <p className="text-sm text-gray-600 mb-2"><strong>Use case:</strong> Bill payments, monthly reports</p>
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Technical RRule</summary>
              <code className="bg-gray-100 px-2 py-1 rounded mt-1 block font-mono text-gray-600">
                {new RRule({ freq: RRule.MONTHLY, bymonthday: 15, count: 6, dtstart: new Date() }).toString()}
              </code>
            </details>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
            <h5 className="font-medium text-yellow-800 mb-1">💡 Pro Tip</h5>
            <p className="text-sm text-yellow-700">
              Use the <strong>Custom RRule Builder</strong> above to create more complex patterns like "every 2nd Tuesday of the month" or "weekdays only".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringPicker;
