import { dayjs } from '../utils/dateUtils';

export interface DaySchedule {
    start: string;
    end: string;
}

export interface WeeklySchedule {
    [day: string]: DaySchedule;
}

export const TIMEZONE = "Asia/Kolkata";

export const weeklySchedule: WeeklySchedule = {
    "Monday": { "start": "9:00", "end": "20:00" },
    "Tuesday": { "start": "9:00", "end": "20:00" },
    "Wednesday": { "start": "9:00", "end": "20:00" },
    "Thursday": { "start": "9:00", "end": "20:00" },
    "Friday": { "start": "9:00", "end": "17:00" },
    "Saturday": { "start": "9:00", "end": "17:00" },
};

/**
 * Get schedule for a specific day of the week
 * @param dayOfWeek - Day name (e.g., "Monday", "Tuesday")
 * @returns DaySchedule if the day is configured, null otherwise
 */
export function getScheduleForDay(dayOfWeek: string): DaySchedule | null {
    return weeklySchedule[dayOfWeek] || null;
}

/**
 * Check if a specific day is a working day
 * @param dayOfWeek - Day name (e.g., "Monday", "Tuesday")
 * @returns true if the day has a schedule configured
 */
export function isWorkingDay(dayOfWeek: string): boolean {
    return dayOfWeek in weeklySchedule;
}

/**
 * Get the next working day from a given date
 * @param date - Starting date (dayjs object)
 * @returns The next working day date, or null if no working days found (shouldn't happen)
 */
export function getNextWorkingDay(date: ReturnType<typeof dayjs>): ReturnType<typeof dayjs> | null {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let currentDate = date.add(1, 'day'); // Start checking from tomorrow
    let attempts = 0;
    const maxAttempts = 7; // Prevent infinite loop
    
    while (attempts < maxAttempts) {
        const dayOfWeek = currentDate.format('dddd');
        if (isWorkingDay(dayOfWeek)) {
            return currentDate;
        }
        currentDate = currentDate.add(1, 'day');
        attempts++;
    }
    
    return null; // Should never reach here if schedule is properly configured
}
