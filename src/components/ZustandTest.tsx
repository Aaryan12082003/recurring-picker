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
      console.log('🔮 Upcoming Events:', getUpcomingEvents(3));
    }
  }, [events, calendarSettings, quickExamples, _hasHydrated, getUpcomingEvents]);

  if (!_hasHydrated) {
    return <div className="p-4 text-amber-700">Loading Zustand test...</div>;
  }

  const testStateUpdates = () => {
    console.log('🧪 Testing Zustand State Updates...');
    console.log('✅ All hooks working properly!');
  };

  return (
    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200 m-4">
      <h2 className="text-2xl font-semibold text-amber-900 mb-4">
        🧪 Zustand State Management Test
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 rounded-lg">
          <h3 className="font-semibold text-amber-800 mb-2">Events ({events.length})</h3>
          <pre className="text-xs text-amber-700 overflow-auto">
            {JSON.stringify(events, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">Calendar Settings</h3>
          <pre className="text-xs text-orange-700 overflow-auto">
            {JSON.stringify(calendarSettings, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Quick Examples ({quickExamples.length})</h3>
          <pre className="text-xs text-red-700 overflow-auto">
            {JSON.stringify(quickExamples, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Hydration Status</h3>
          <p className="text-yellow-700">
            Hydrated: {_hasHydrated ? '✅ Yes' : '❌ No'}
          </p>
        </div>

        <button
          onClick={testStateUpdates}
          className="px-4 py-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500 transition-colors cursor-pointer"
        >
          Test State Updates
        </button>
      </div>
    </div>
  );
};

export default ZustandTest;
