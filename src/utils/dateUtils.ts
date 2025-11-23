import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TIMEZONE } from '../config/schedule';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

export const parseDateTime = (dateStr: string, timeStr: string) => {
    // Parse the date/time string and interpret it as Asia/Kolkata timezone
    return dayjs.tz(`${dateStr} ${timeStr}`, 'DD/MM/YYYY HH:mm', TIMEZONE);
};

export const formatDate = (dateStr: string) => {
    // Parse the date string and interpret it as Asia/Kolkata timezone
    return dayjs.tz(dateStr, 'DD/MM/YYYY', TIMEZONE);
};

export const getISOString = (date: dayjs.Dayjs) => {
    // Convert date to ISO string (UTC)
    // Dates created with parseDateTime/formatDate are already timezone-aware in Asia/Kolkata
    // toISOString() will correctly convert them to UTC
    return date.toISOString();
};

/**
 * Parse a date string from Google Calendar API (UTC ISO string) and convert to Asia/Kolkata timezone
 */
export const parseFromGoogleCalendar = (dateString: string | undefined): dayjs.Dayjs => {
    if (!dateString) {
        // Return current time in Asia/Kolkata timezone as fallback
        return dayjs.tz(TIMEZONE);
    }
    // Google Calendar API returns UTC ISO strings, convert to Asia/Kolkata
    return dayjs.utc(dateString).tz(TIMEZONE);
};

export const MEETING_DURATION_MINUTES = 15;

/**
 * Round a date/time up to the next 15-minute slot
 */
export const roundToNextSlot = (date: dayjs.Dayjs): dayjs.Dayjs => {
    const minutes = date.minute();
    const remainder = minutes % MEETING_DURATION_MINUTES;
    
    if (remainder === 0) {
        // Already on a slot boundary, add one slot to get the next one
        return date.add(MEETING_DURATION_MINUTES, 'minute').second(0).millisecond(0);
    }
    
    // Round up to next 15-minute boundary
    const minutesToAdd = MEETING_DURATION_MINUTES - remainder;
    return date.add(minutesToAdd, 'minute').second(0).millisecond(0);
};

export { dayjs };
