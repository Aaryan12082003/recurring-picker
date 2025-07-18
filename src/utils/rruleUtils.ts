import { RRule, RRuleSet, rrulestr } from 'rrule';

export interface RRuleConfig {
  freq: number;
  interval?: number;
  count?: number;
  until?: Date;
  byweekday?: number[];
  bymonthday?: number[];
  bymonth?: number[];
  byhour?: number[];
  byminute?: number[];
}

export class RRuleUtils {
  /**
   * Create a basic recurring rule
   */
  static createRule(config: RRuleConfig, startDate: Date): RRule {
    return new RRule({
      dtstart: startDate,
      ...config
    });
  }

  /**
   * Create a complex rule with multiple patterns (using RRuleSet)
   */
  static createComplexRule(startDate: Date): RRuleSet {
    const rruleSet = new RRuleSet();
    
    // Add a base rule - every weekday
    rruleSet.rrule(new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
      dtstart: startDate
    }));

    // Add exception dates (holidays, vacation days)
    const holiday = new Date(startDate);
    holiday.setDate(holiday.getDate() + 7);
    rruleSet.exdate(holiday);

    // Add extra dates (special events)
    const extraEvent = new Date(startDate);
    extraEvent.setDate(extraEvent.getDate() + 14);
    extraEvent.setHours(14, 0, 0, 0); // 2 PM
    rruleSet.rdate(extraEvent);

    return rruleSet;
  }

  /**
   * Parse RRule string
   */
  static parseRRuleString(rruleString: string): RRule {
    return rrulestr(rruleString);
  }

  /**
   * Get next N occurrences
   */
  static getNextOccurrences(rule: RRule | RRuleSet, count: number = 5): Date[] {
    const now = new Date();
    return rule.between(now, new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000))
              .slice(0, count);
  }

  /**
   * Get occurrences between two dates
   */
  static getOccurrencesBetween(rule: RRule | RRuleSet, start: Date, end: Date): Date[] {
    return rule.between(start, end, true);
  }

  /**
   * Common recurring patterns
   */
  static getCommonPatterns() {
    return {
      daily: (startDate: Date, count: number = 30) => new RRule({
        freq: RRule.DAILY,
        count,
        dtstart: startDate
      }),
      
      weekdays: (startDate: Date, count: number = 20) => new RRule({
        freq: RRule.WEEKLY,
        byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
        count,
        dtstart: startDate
      }),
      
      weekends: (startDate: Date, count: number = 10) => new RRule({
        freq: RRule.WEEKLY,
        byweekday: [RRule.SA, RRule.SU],
        count,
        dtstart: startDate
      }),
      
      monthly: (startDate: Date, count: number = 12) => new RRule({
        freq: RRule.MONTHLY,
        count,
        dtstart: startDate
      }),
      
      monthlyByDay: (startDate: Date, count: number = 12) => new RRule({
        freq: RRule.MONTHLY,
        byweekday: RRule.MO.nth(1), // First Monday of each month
        count,
        dtstart: startDate
      }),
      
      quarterly: (startDate: Date, count: number = 4) => new RRule({
        freq: RRule.MONTHLY,
        interval: 3,
        count,
        dtstart: startDate
      }),
      
      yearly: (startDate: Date, count: number = 5) => new RRule({
        freq: RRule.YEARLY,
        count,
        dtstart: startDate
      })
    };
  }

  /**
   * Convert RRule to human readable text
   */
  static toHumanText(rule: RRule): string {
    try {
      return rule.toText();
    } catch (error) {
      return rule.toString();
    }
  }

  /**
   * Check if a date matches the rule
   */
  static isOccurrence(rule: RRule | RRuleSet, date: Date): boolean {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const occurrences = rule.between(startOfDay, endOfDay, true);
    return occurrences.length > 0;
  }

  /**
   * Get the next occurrence after a given date
   */
  static getNextOccurrence(rule: RRule | RRuleSet, afterDate: Date): Date | null {
    const occurrences = rule.between(afterDate, new Date(afterDate.getTime() + 365 * 24 * 60 * 60 * 1000));
    return occurrences.length > 0 ? occurrences[0] : null;
  }

  /**
   * Create business hours rule (Monday-Friday, 9 AM - 5 PM)
   */
  static createBusinessHoursRule(startDate: Date, count: number = 50): RRule {
    const businessStart = new Date(startDate);
    businessStart.setHours(9, 0, 0, 0);
    
    return new RRule({
      freq: RRule.WEEKLY,
      byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
      byhour: [9, 10, 11, 12, 13, 14, 15, 16, 17],
      count,
      dtstart: businessStart
    });
  }
}

export default RRuleUtils;
