import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RRule } from 'rrule';

// Types
export interface RecurringEvent {
  id: string;
  title: string;
  startDate: Date;
  rrule: RRule;
  description?: string;
}

export interface EventFormData {
  title: string;
  startDate: string;
  frequency: number;
  interval: number | string;
  count: number | string;
  byweekday: number[];
  description: string;
}

export interface CalendarSettings {
  view: 'month' | 'week' | 'day';
  selectedDate: Date;
  showWeekends: boolean;
  timeFormat: '12h' | '24h';
}

// Store interface
interface EventStore {
  // Events state
  events: RecurringEvent[];
  upcomingOccurrences: Date[];
  
  // Form state
  eventForm: EventFormData;
  
  // Calendar settings
  calendarSettings: CalendarSettings;
  
  // UI state
  isLoading: boolean;
  selectedEvent: RecurringEvent | null;
  
  // Actions for events
  addEvent: (event: RecurringEvent) => void;
  removeEvent: (eventId: string) => void;
  updateEvent: (eventId: string, updates: Partial<RecurringEvent>) => void;
  clearEvents: () => void;
  
  // Actions for form
  updateEventForm: (updates: Partial<EventFormData>) => void;
  resetEventForm: () => void;
  
  // Actions for calendar settings
  updateCalendarSettings: (updates: Partial<CalendarSettings>) => void;
  setSelectedDate: (date: Date) => void;
  
  // Actions for UI state
  setLoading: (loading: boolean) => void;
  setSelectedEvent: (event: RecurringEvent | null) => void;
  
  // Computed actions
  refreshUpcomingOccurrences: () => void;
  getEventsForDate: (date: Date) => Date[];
}

// Default form data
const defaultEventForm: EventFormData = {
  title: '',
  startDate: '',
  frequency: RRule.WEEKLY,
  interval: 1,
  count: 10,
  byweekday: [],
  description: ''
};

// Default calendar settings
const defaultCalendarSettings: CalendarSettings = {
  view: 'month',
  selectedDate: new Date(),
  showWeekends: true,
  timeFormat: '12h'
};

// Custom serialization for RRule objects
const serializeEvent = (event: RecurringEvent) => ({
  ...event,
  startDate: event.startDate.toISOString(),
  rrule: event.rrule.toString()
});

const deserializeEvent = (serialized: any): RecurringEvent => ({
  ...serialized,
  startDate: new Date(serialized.startDate),
  rrule: RRule.fromString(serialized.rrule)
});

// Create the store with persistence and proper SSR handling
export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      // Initial state
      events: [],
      upcomingOccurrences: [],
      eventForm: defaultEventForm,
      calendarSettings: defaultCalendarSettings,
      isLoading: false,
      selectedEvent: null,

      // Event actions
      addEvent: (event) => {
        set((state) => ({
          events: [...state.events, event]
        }));
        get().refreshUpcomingOccurrences();
      },

      removeEvent: (eventId) => {
        set((state) => ({
          events: state.events.filter(e => e.id !== eventId),
          selectedEvent: state.selectedEvent?.id === eventId ? null : state.selectedEvent
        }));
        get().refreshUpcomingOccurrences();
      },

      updateEvent: (eventId, updates) => {
        set((state) => ({
          events: state.events.map(e => 
            e.id === eventId ? { ...e, ...updates } : e
          ),
          selectedEvent: state.selectedEvent?.id === eventId 
            ? { ...state.selectedEvent, ...updates } 
            : state.selectedEvent
        }));
        get().refreshUpcomingOccurrences();
      },

      clearEvents: () => {
        set({
          events: [],
          upcomingOccurrences: [],
          selectedEvent: null
        });
      },

      // Form actions
      updateEventForm: (updates) => {
        set((state) => ({
          eventForm: { ...state.eventForm, ...updates }
        }));
      },

      resetEventForm: () => {
        set({ eventForm: defaultEventForm });
      },

      // Calendar settings actions
      updateCalendarSettings: (updates) => {
        set((state) => ({
          calendarSettings: { ...state.calendarSettings, ...updates }
        }));
      },

      setSelectedDate: (date) => {
        set((state) => ({
          calendarSettings: { ...state.calendarSettings, selectedDate: date }
        }));
      },

      // UI actions
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setSelectedEvent: (event) => {
        set({ selectedEvent: event });
      },

      // Computed actions
      refreshUpcomingOccurrences: () => {
        const { events } = get();
        const now = new Date();
        const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // Next 90 days
        
        const allOccurrences: Date[] = [];
        
        events.forEach(event => {
          try {
            const occurrences = event.rrule.between(now, futureDate, true);
            allOccurrences.push(...occurrences);
          } catch (error) {
            console.warn('Error getting occurrences for event:', event.title, error);
          }
        });

        // Sort by date and limit to reasonable number
        allOccurrences.sort((a, b) => a.getTime() - b.getTime());
        
        set({ upcomingOccurrences: allOccurrences.slice(0, 100) });
      },

      getEventsForDate: (date) => {
        const { upcomingOccurrences } = get();
        return upcomingOccurrences.filter(
          occurrence => occurrence.toDateString() === date.toDateString()
        );
      }
    }),
    {
      name: 'recall-event-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on the client side
        if (typeof window !== 'undefined') {
          return {
            getItem: (name) => {
              const str = localStorage.getItem(name);
              if (!str) return null;
              
              try {
                const parsed = JSON.parse(str);
                if (parsed.state?.events) {
                  parsed.state.events = parsed.state.events.map(deserializeEvent);
                }
                if (parsed.state?.selectedEvent) {
                  parsed.state.selectedEvent = deserializeEvent(parsed.state.selectedEvent);
                }
                if (parsed.state?.calendarSettings?.selectedDate) {
                  parsed.state.calendarSettings.selectedDate = new Date(parsed.state.calendarSettings.selectedDate);
                }
                
                return parsed;
              } catch (error) {
                console.warn('Error parsing stored data:', error);
                return null;
              }
            },
            setItem: (name, value) => {
              try {
                const parsed = JSON.parse(value);
                const serialized = {
                  ...parsed,
                  state: {
                    ...parsed.state,
                    events: parsed.state.events?.map(serializeEvent) || [],
                    selectedEvent: parsed.state.selectedEvent ? serializeEvent(parsed.state.selectedEvent) : null,
                    calendarSettings: parsed.state.calendarSettings ? {
                      ...parsed.state.calendarSettings,
                      selectedDate: parsed.state.calendarSettings.selectedDate?.toISOString()
                    } : defaultCalendarSettings
                  }
                };
                localStorage.setItem(name, JSON.stringify(serialized));
              } catch (error) {
                console.warn('Error storing data:', error);
              }
            },
            removeItem: (name) => localStorage.removeItem(name)
          };
        }
        // Return a no-op storage for server-side
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };
      }),
      skipHydration: false,
    }
  )
);

// Selector hooks for better performance
export const useEvents = () => useEventStore((state) => state.events);
export const useUpcomingOccurrences = () => useEventStore((state) => state.upcomingOccurrences);
export const useEventForm = () => useEventStore((state) => state.eventForm);
export const useCalendarSettings = () => useEventStore((state) => state.calendarSettings);
export const useSelectedEvent = () => useEventStore((state) => state.selectedEvent);
export const useIsLoading = () => useEventStore((state) => state.isLoading);

// Action hooks
export const useEventActions = () => useEventStore((state) => ({
  addEvent: state.addEvent,
  removeEvent: state.removeEvent,
  updateEvent: state.updateEvent,
  clearEvents: state.clearEvents,
  refreshUpcomingOccurrences: state.refreshUpcomingOccurrences,
  getEventsForDate: state.getEventsForDate
}));

export const useFormActions = () => useEventStore((state) => ({
  updateEventForm: state.updateEventForm,
  resetEventForm: state.resetEventForm
}));

export const useCalendarActions = () => useEventStore((state) => ({
  updateCalendarSettings: state.updateCalendarSettings,
  setSelectedDate: state.setSelectedDate
}));

export const useUIActions = () => useEventStore((state) => ({
  setLoading: state.setLoading,
  setSelectedEvent: state.setSelectedEvent
}));
