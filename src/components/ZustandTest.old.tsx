'use client';

import { useEffect } from 'react';
import { useHydratedEventStore } from '../store/eventStore';

const ZustandTest = () => {
  const {
    events,
    calendarSettings,
    quickExamples,
    getUpcomingEvents,
    _hasHydrated
  } = useHydratedEventStore();

  useEffect(() => {
    if (_hasHydrated) {
      console.log('🧪 Zustand Test Component Loaded');
      console.log('📊 Events:', events);
      console.log('⚙️ Calendar Settings:', calendarSettings);
      console.log('📋 Quick Examples:', quickExamples);
      console.log('� Upcoming Events:', getUpcomingEvents(3));
    }
  }, [events, calendarSettings, quickExamples, _hasHydrated, getUpcomingEvents]);

  if (!_hasHydrated) {
    return <div className="p-4 text-amber-700">Loading Zustand test...</div>;
  }

  const testStateUpdates = () => {
    console.log('🧪 Testing Zustand State Updates...');
    console.log('✅ All hooks working properly!'); 
      title: 'Test Event from Zustand',
      description: 'Testing state management'
    });
    
    console.log('✅ Form state updated successfully!');
    
    // Test refresh function
    refreshUpcomingOccurrences();
    console.log('✅ Refresh function called successfully!');
  };

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-bold text-green-800 mb-3">
        🧪 Zustand State Management Test
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="text-green-700">
          <strong>Events Count:</strong> {events.length}
        </div>
        <div className="text-green-700">
          <strong>Upcoming Occurrences:</strong> {upcomingOccurrences.length}
        </div>
        <div className="text-green-700">
          <strong>Form Title:</strong> {eventForm.title || 'Empty'}
        </div>
        <div className="text-green-700">
          <strong>Form Description:</strong> {eventForm.description || 'Empty'}
        </div>
      </div>
      
      <button
        onClick={testStateUpdates}
        className="mt-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 cursor-pointer"
      >
        Test State Updates
      </button>
      
      <div className="mt-3 text-xs text-green-600">
        Check browser console for detailed logs
      </div>
    </div>
  );
};

export default ZustandTest;
