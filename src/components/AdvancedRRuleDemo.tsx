'use client';

import { useState, useEffect, useMemo } from 'react';
import { RRule } from 'rrule';
import ModernCalendar from './ModernCalendar';

const AdvancedRRuleDemo = () => {
  const [occurrences, setOccurrences] = useState<Date[]>([]);
  const [ruleText, setRuleText] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  
  // User configurable options
  const [frequency, setFrequency] = useState(RRule.WEEKLY);
  const [interval, setInterval] = useState<number | string>(1);
  const [count, setCount] = useState<number | string>(10);
  const [until, setUntil] = useState('');
  const [useCount, setUseCount] = useState(true);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');

  // Memoized calendar events for performance
  const calendarEvents = useMemo(() => {
    return occurrences.map(date => ({
      date,
      title: 'Recurring Event'
    }));
  }, [occurrences]);

  const handleDateClick = (date: Date) => {
    // You can add custom logic here when a date is clicked
    console.log('Date clicked:', date.toLocaleDateString());
  };

  const generateRule = () => {
    const date = new Date(startDate);
    
    const ruleOptions: any = {
      freq: frequency,
      interval: typeof interval === 'string' ? (interval === '' ? 1 : parseInt(interval)) : interval,
      dtstart: date,
    };

    // Add end condition
    if (useCount) {
      ruleOptions.count = typeof count === 'string' ? (count === '' ? 1 : parseInt(count)) : count;
    } else if (until) {
      ruleOptions.until = new Date(until);
    }

    // Add weekdays if selected
    if (selectedWeekdays.length > 0) {
      ruleOptions.byweekday = selectedWeekdays.map(day => 
        day === 0 ? RRule.MO : 
        day === 1 ? RRule.TU :
        day === 2 ? RRule.WE :
        day === 3 ? RRule.TH :
        day === 4 ? RRule.FR :
        day === 5 ? RRule.SA :
        RRule.SU
      );
    }

    // Add month day if specified
    if (monthDay) {
      ruleOptions.bymonthday = parseInt(monthDay);
    }

    // Add time constraints
    if (hour) {
      ruleOptions.byhour = parseInt(hour);
    }
    if (minute) {
      ruleOptions.byminute = parseInt(minute);
    }

    try {
      const rule = new RRule(ruleOptions);
      const dates = rule.all().slice(0, 20); // Limit to 20 for display
      setOccurrences(dates);
      setRuleText(rule.toString());
    } catch (error) {
      console.error('Error creating rule:', error);
      setOccurrences([]);
      setRuleText('Invalid rule configuration');
    }
  };

  // Function to convert RRule to human-readable text
  const getRuleDescription = () => {
    if (!ruleText || ruleText === 'Invalid rule configuration') return ruleText;

    const intervalValue = typeof interval === 'string' ? (interval === '' ? 1 : parseInt(interval)) : interval;
    const countValue = typeof count === 'string' ? (count === '' ? 1 : parseInt(count)) : count;
    
    let description = '';
    
    // Frequency description
    if (frequency === RRule.DAILY) {
      description = intervalValue === 1 ? 'Every day' : `Every ${intervalValue} days`;
    } else if (frequency === RRule.WEEKLY) {
      if (intervalValue === 1) {
        if (selectedWeekdays.length > 0) {
          const dayNames = selectedWeekdays.map(day => weekdays[day].label).join(', ');
          description = `Every week on ${dayNames}`;
        } else {
          description = 'Every week';
        }
      } else {
        if (selectedWeekdays.length > 0) {
          const dayNames = selectedWeekdays.map(day => weekdays[day].label).join(', ');
          description = `Every ${intervalValue} weeks on ${dayNames}`;
        } else {
          description = `Every ${intervalValue} weeks`;
        }
      }
    } else if (frequency === RRule.MONTHLY) {
      if (monthDay) {
        description = intervalValue === 1 
          ? `Every month on the ${monthDay}${getOrdinalSuffix(parseInt(monthDay))}` 
          : `Every ${intervalValue} months on the ${monthDay}${getOrdinalSuffix(parseInt(monthDay))}`;
      } else {
        description = intervalValue === 1 ? 'Every month' : `Every ${intervalValue} months`;
      }
    } else if (frequency === RRule.YEARLY) {
      description = intervalValue === 1 ? 'Every year' : `Every ${intervalValue} years`;
    }

    // Time description
    if (hour && minute) {
      const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      description += ` at ${timeStr}`;
    } else if (hour) {
      description += ` at ${hour}:00`;
    }

    // End condition description
    if (useCount) {
      description += `, for ${countValue} occurrence${countValue !== 1 ? 's' : ''}`;
    } else if (until) {
      const untilDate = new Date(until).toLocaleDateString();
      description += `, until ${untilDate}`;
    }

    // Start date
    const startDateStr = new Date(startDate).toLocaleDateString();
    description += `, starting from ${startDateStr}`;

    return description;
  };

  // Helper function for ordinal suffixes
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const frequencies = [
    { value: RRule.DAILY, label: 'Daily' },
    { value: RRule.WEEKLY, label: 'Weekly' },
    { value: RRule.MONTHLY, label: 'Monthly' },
    { value: RRule.YEARLY, label: 'Yearly' }
  ];

  const weekdays = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Custom RRule Builder</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              {frequencies.map(freq => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interval (Every X {frequencies.find(f => f.value === frequency)?.label.toLowerCase()})
            </label>
            <input
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(e.target.value === '' ? '' : parseInt(e.target.value))}
              onBlur={(e) => setInterval(e.target.value === '' ? 1 : parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Condition
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useCount}
                  onChange={() => setUseCount(true)}
                  className="mr-2"
                />
                <span className="text-black">End after</span>
                <input
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                  onBlur={(e) => setCount(e.target.value === '' ? 1 : parseInt(e.target.value) || 1)}
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-black"
                  disabled={!useCount}
                />
                <span className="ml-1 text-black">occurrences</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useCount}
                  onChange={() => setUseCount(false)}
                  className="mr-2"
                />
                <span className="text-black">End on</span>
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="ml-2 px-2 py-1 border border-gray-300 rounded text-black"
                  disabled={useCount}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Hour (0-23)"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-black placeholder-gray-500"
              />
              <input
                type="number"
                placeholder="Minute (0-59)"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-black placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {frequency === RRule.WEEKLY && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    selectedWeekdays.includes(day.value)
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

        {frequency === RRule.MONTHLY && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Day of Month (Optional)
            </label>
            <input
              type="number"
              placeholder="Day (1-31)"
              min="1"
              max="31"
              value={monthDay}
              onChange={(e) => setMonthDay(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
            />
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={generateRule}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            Generate Recurring Dates
          </button>
        </div>

        {ruleText && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Generated Recurrence Rule</h3>
            
            {/* Human-readable description */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">In Simple Terms:</h4>
                  <p className="text-sm text-blue-700 mt-1 font-medium">{getRuleDescription()}</p>
                </div>
              </div>
            </div>

            {/* Technical RRule - Collapsible */}
            <details className="bg-gray-50 rounded-md">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                🔧 Technical RRule (Click to expand)
              </summary>
              <div className="px-4 pb-3">
                <code className="text-xs text-gray-600 break-all font-mono block bg-white p-2 rounded border">{ruleText}</code>
                <p className="text-xs text-gray-500 mt-2">
                  This is the technical format used by calendar applications and scheduling systems.
                </p>
              </div>
            </details>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Calendar View</h3>
        {occurrences.length === 0 ? (
          <p className="text-gray-500">Click "Generate Recurring Dates" to see occurrences on calendar.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Generated {occurrences.length} occurrences. Click on dates to see details.
            </p>
            <ModernCalendar 
              events={calendarEvents}
              onDateClick={handleDateClick}
              className="w-full"
            />
            
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-blue-600">Total Events</div>
                <div className="text-lg font-semibold text-blue-800">{occurrences.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <div className="text-sm text-green-600">Next Event</div>
                <div className="text-lg font-semibold text-green-800">
                  {occurrences.length > 0 ? occurrences[0].toLocaleDateString() : 'None'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Quick Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              setFrequency(RRule.WEEKLY);
              setSelectedWeekdays([0, 2]); // Monday, Wednesday
              setInterval(1);
              setCount(10);
              setUseCount(true);
              setHour('9');
              setMinute('0');
            }}
            className="p-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 text-left"
          >
            <h4 className="font-semibold text-blue-800">Every Mon & Wed at 9 AM</h4>
            <p className="text-sm text-blue-600">Weekly meeting pattern</p>
          </button>

          <button
            onClick={() => {
              setFrequency(RRule.MONTHLY);
              setMonthDay('15');
              setInterval(1);
              setCount(12);
              setUseCount(true);
              setHour('14');
              setMinute('0');
            }}
            className="p-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 text-left"
          >
            <h4 className="font-semibold text-green-800">15th of every month at 2 PM</h4>
            <p className="text-sm text-green-600">Monthly report deadline</p>
          </button>

          <button
            onClick={() => {
              setFrequency(RRule.DAILY);
              setInterval(1);
              setCount(30);
              setUseCount(true);
              setHour('8');
              setMinute('30');
            }}
            className="p-3 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 text-left"
          >
            <h4 className="font-semibold text-purple-800">Daily at 8:30 AM</h4>
            <p className="text-sm text-purple-600">Daily standup for 30 days</p>
          </button>

          <button
            onClick={() => {
              setFrequency(RRule.WEEKLY);
              setSelectedWeekdays([0, 1, 2, 3, 4]); // Weekdays
              setInterval(1);
              setCount(50);
              setUseCount(true);
              setHour('');
              setMinute('');
            }}
            className="p-3 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 text-left"
          >
            <h4 className="font-semibold text-orange-800">Weekdays only</h4>
            <p className="text-sm text-orange-600">Business days pattern</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedRRuleDemo;
