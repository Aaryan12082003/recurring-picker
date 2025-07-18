import RecurringPicker from '../components/RecurringPicker';
import AdvancedRRuleDemo from '../components/AdvancedRRuleDemo';
import RecurrencePlayground from '../components/RecurrencePlayground';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ReCall - Recurring Event Picker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create and manage recurring events with powerful RRule logic. 
            Set up daily, weekly, monthly, or yearly recurring patterns with ease.
          </p>
        </div>
        
        <div className="space-y-12">
          <RecurrencePlayground />

          <RecurringPicker />
          
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Advanced Patterns
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto text-center mb-8">
              Explore advanced recurring patterns and see how RRule can handle complex scheduling scenarios.
            </p>
            <AdvancedRRuleDemo />
          </div>
        </div>
      </div>
    </div>
  );
}
