import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { RRule } from 'rrule';

export interface CalendarEvent {
  id: string;
  title: string;
  rrule: RRule;
  description?: string;
  startDate: Date;
  endDate?: Date;
  color?: string;
}

export interface CalendarSettings {
  selectedDate: Date;
  currentView: 'month' | 'year';
  showWeekNumbers: boolean;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
}

interface EventStore {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Events
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Calendar settings
  calendarSettings: CalendarSettings;
  updateCalendarSettings: (settings: Partial<CalendarSettings>) => void;
  
  // Quick examples
  quickExamples: string[];
  addQuickExample: (rruleString: string) => void;
  removeQuickExample: (rruleString: string) => void;
  
  // Utility
  getEventsForDate: (date: Date) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];
}

const defaultCalendarSettings: CalendarSettings = {
  selectedDate: new Date(),
  currentView: 'month',
  showWeekNumbers: false,
  firstDayOfWeek: 0,
};

const defaultQuickExamples = [
  'FREQ=DAILY',
  'FREQ=WEEKLY;BYDAY=MO,WE,FR',
  'FREQ=MONTHLY;BYMONTHDAY=1',
  'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
];

export const useEventStore = create<EventStore>()(
  subscribeWithSelector((set, get) => ({
    // Hydration state
    _hasHydrated: false,
    setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

    // Events
    events: [],
    addEvent: (event) =>
      set((state) => ({
        events: [
          ...state.events,
          {
            ...event,
            id: crypto.randomUUID(),
          },
        ],
      })),
    updateEvent: (id, updates) =>
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        ),
      })),
    deleteEvent: (id) =>
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
      })),

    // Calendar settings
    calendarSettings: defaultCalendarSettings,
    updateCalendarSettings: (settings) =>
      set((state) => ({
        calendarSettings: { ...state.calendarSettings, ...settings },
      })),

    // Quick examples
    quickExamples: defaultQuickExamples,
    addQuickExample: (rruleString) =>
      set((state) => ({
        quickExamples: [...state.quickExamples, rruleString],
      })),
    removeQuickExample: (rruleString) =>
      set((state) => ({
        quickExamples: state.quickExamples.filter((ex) => ex !== rruleString),
      })),

    // Utility functions
    getEventsForDate: (date) => {
      const events = get().events;
      return events.filter((event) => {
        try {
          const occurrences = event.rrule.between(
            new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
            true
          );
          return occurrences.length > 0;
        } catch (error) {
          console.warn('Error checking event occurrence:', error);
          return false;
        }
      });
    },

    getUpcomingEvents: (limit = 10) => {
      const events = get().events;
      const now = new Date();
      const upcoming: { event: CalendarEvent; nextOccurrence: Date }[] = [];

      events.forEach((event) => {
        try {
          const nextOccurrence = event.rrule.after(now);
          if (nextOccurrence) {
            upcoming.push({ event, nextOccurrence });
          }
        } catch (error) {
          console.warn('Error getting next occurrence:', error);
        }
      });

      return upcoming
        .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime())
        .slice(0, limit)
        .map((item) => item.event);
    },
  }))
);

// Hydration helper hook
export const useHydratedEventStore = () => {
  const store = useEventStore();
  
  // Return default values during SSR
  if (!store._hasHydrated) {
    return {
      ...store,
      events: [],
      calendarSettings: defaultCalendarSettings,
      quickExamples: defaultQuickExamples,
    };
  }
  
  return store;
};

// Initialize hydration on client side
if (typeof window !== 'undefined') {
  // Load persisted data from localStorage
  const loadPersistedData = () => {
    try {
      const stored = localStorage.getItem('event-store');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Deserialize RRule objects and dates
        if (data.events) {
          data.events = data.events.map((event: any) => ({
            ...event,
            rrule: new RRule(RRule.parseString(event.rruleString)),
            startDate: new Date(event.startDate),
            endDate: event.endDate ? new Date(event.endDate) : undefined,
          }));
        }
        
        if (data.calendarSettings?.selectedDate) {
          data.calendarSettings.selectedDate = new Date(data.calendarSettings.selectedDate);
        }
        
        // Update store with persisted data
        useEventStore.setState({
          events: data.events || [],
          calendarSettings: data.calendarSettings || defaultCalendarSettings,
          quickExamples: data.quickExamples || defaultQuickExamples,
          _hasHydrated: true,
        });
      } else {
        useEventStore.setState({ _hasHydrated: true });
      }
    } catch (error) {
      console.warn('Failed to load persisted data:', error);
      useEventStore.setState({ _hasHydrated: true });
    }
  };

  // Subscribe to store changes and persist to localStorage
  useEventStore.subscribe(
    (state) => ({
      events: state.events,
      calendarSettings: state.calendarSettings,
      quickExamples: state.quickExamples,
    }),
    (data) => {
      if (useEventStore.getState()._hasHydrated) {
        try {
          const serializedData = {
            events: data.events.map((event) => ({
              ...event,
              rruleString: event.rrule.toString(),
              startDate: event.startDate.toISOString(),
              endDate: event.endDate?.toISOString(),
            })),
            calendarSettings: {
              ...data.calendarSettings,
              selectedDate: data.calendarSettings.selectedDate.toISOString(),
            },
            quickExamples: data.quickExamples,
          };
          
          localStorage.setItem('event-store', JSON.stringify(serializedData));
        } catch (error) {
          console.warn('Failed to persist data:', error);
        }
      }
    }
  );

  // Load data after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPersistedData);
  } else {
    loadPersistedData();
  }
}
