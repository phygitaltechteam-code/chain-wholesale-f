export interface WeekCycleConfig {
  startDay: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  endDay: number;   // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  cycleId: string;
}

export const WEEK_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const WEEK_CYCLE_PRESETS = [
  { id: 'monday_to_sunday', label: 'Monday to Sunday', startDay: 1, endDay: 0 },
  { id: 'sunday_to_sunday', label: 'Sunday to Sunday', startDay: 0, endDay: 0 },
  { id: 'sunday_to_saturday', label: 'Sunday to Saturday', startDay: 0, endDay: 6 },
  { id: 'monday_to_saturday', label: 'Monday to Saturday', startDay: 1, endDay: 6 },
  { id: 'custom', label: 'Custom From / To Day', startDay: 1, endDay: 0 },
];

export const getSavedWeekCycle = (): WeekCycleConfig => {
  try {
    const saved = localStorage.getItem('app_week_cycle');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.startDay === 'number' && typeof parsed.endDay === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading week cycle from localStorage:', e);
  }
  return { startDay: 1, endDay: 0, cycleId: 'monday_to_sunday' };
};

export const saveWeekCycle = (config: WeekCycleConfig) => {
  try {
    localStorage.setItem('app_week_cycle', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('app_week_cycle_changed', { detail: config }));
  } catch (e) {
    console.error('Error saving week cycle:', e);
  }
};

/**
 * Calculates current week's from and to Date objects based on the configured cycle.
 */
export const getCurrentAppWeekRange = (referenceDate = new Date()) => {
  const { startDay, endDay, cycleId } = getSavedWeekCycle();
  const now = new Date(referenceDate);
  const currentDay = now.getDay(); // 0 (Sun) - 6 (Sat)

  // Calculate difference to the start day of the current week cycle
  const diffToStart = (currentDay - startDay + 7) % 7;
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - diffToStart);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(fromDate);
  if (startDay === endDay) {
    // If e.g. Sunday to Sunday, span 7 days
    toDate.setDate(fromDate.getDate() + 7);
  } else {
    // Difference between startDay and endDay
    const span = (endDay - startDay + 7) % 7;
    toDate.setDate(fromDate.getDate() + (span === 0 ? 6 : span));
  }
  toDate.setHours(23, 59, 59, 999);

  const formatStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    fromDate,
    toDate,
    fromStr: formatStr(fromDate),
    toStr: formatStr(toDate),
    startDay,
    endDay,
    cycleId,
  };
};
