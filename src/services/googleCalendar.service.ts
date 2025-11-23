import { google } from 'googleapis';
import { config } from '../config/env';
import { dayjs, getISOString, MEETING_DURATION_MINUTES, parseFromGoogleCalendar } from '../utils/dateUtils';
import { TIMEZONE } from '../config/schedule';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

interface BusyPeriod {
    start: string | { dateTime?: string };
    end: string | { dateTime?: string };
}

const jwtClient = new google.auth.JWT({
    email: config.google.clientEmail,
    key: config.google.privateKey,
    scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth: jwtClient });

export class CalendarService {

    /**
     * Fetch busy periods from Google Calendar
     */
    private async getBusyPeriods(start: string, end: string): Promise<BusyPeriod[]> {
        const result = await calendar.freebusy.query({
            requestBody: {
                timeMin: start,
                timeMax: end,
                items: [{ id: config.calendarId }],
            },
        });

        return (result.data.calendars?.[config.calendarId]?.busy || []) as BusyPeriod[];
    }

    /**
     * Generate free slots
     */
    async findFreeSlots(startDateTime: dayjs.Dayjs, endDateTime: dayjs.Dayjs, maxSlots: number = 4) {
        const busyItems = await this.getBusyPeriods(getISOString(startDateTime), getISOString(endDateTime));

        const freeSlots: string[] = [];
        let currentSlot = startDateTime;

        // Iterate in 15 min increments
        while (true) {
            const slotEnd = currentSlot.add(MEETING_DURATION_MINUTES, 'minute');

            // Stop if the slot end goes beyond the end time
            if (slotEnd.isAfter(endDateTime)) {
                break;
            }

            const isBusy = busyItems.some((busy) => {
                // Handle both dateTime and date formats from Google Calendar API
                const busyStartValue = typeof busy.start === 'string' ? busy.start : busy.start?.dateTime;
                const busyEndValue = typeof busy.end === 'string' ? busy.end : busy.end?.dateTime;

                // Parse Google Calendar API dates (UTC) and convert to Asia/Kolkata timezone
                const busyStart = parseFromGoogleCalendar(busyStartValue);
                const busyEnd = parseFromGoogleCalendar(busyEndValue);

                // Check overlap: (StartA < EndB) && (EndA > StartB)
                return currentSlot.isBefore(busyEnd) && slotEnd.isAfter(busyStart);
            });

            if (!isBusy) {
                freeSlots.push(currentSlot.format('YYYY-MM-DD HH:mm'));
            }

            currentSlot = slotEnd;
        }

        // Proper Fisher-Yates shuffle and limit
        return this.shuffleArray(freeSlots).slice(0, maxSlots);
    }

    /**
     * Fisher-Yates shuffle algorithm for proper randomization
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Check specific slot availability
     */
    async checkAvailability(slotStart: dayjs.Dayjs) {
        const slotEnd = slotStart.add(MEETING_DURATION_MINUTES, 'minute');

        // Query a slightly wider range to catch any overlapping events
        // Clone dates to avoid mutating the input
        const queryStart = slotStart.subtract(1, 'minute');
        const queryEnd = slotEnd.add(1, 'minute');
        const busyItems = await this.getBusyPeriods(
            getISOString(queryStart),
            getISOString(queryEnd)
        );

        // Check if any busy period overlaps with our slot
        const hasOverlap = busyItems.some((busy) => {
            const busyStartValue = typeof busy.start === 'string' ? busy.start : busy.start?.dateTime;
            const busyEndValue = typeof busy.end === 'string' ? busy.end : busy.end?.dateTime;

            // Parse Google Calendar API dates (UTC) and convert to Asia/Kolkata timezone
            const busyStart = parseFromGoogleCalendar(busyStartValue);
            const busyEnd = parseFromGoogleCalendar(busyEndValue);

            // Check overlap: (StartA < EndB) && (EndA > StartB)
            return slotStart.isBefore(busyEnd) && slotEnd.isAfter(busyStart);
        });

        return !hasOverlap;
    }

    /**
     * Create Calendar Event
     */
    async createEvent(details: { name: string; email: string; mobile: string; notes?: string; start: dayjs.Dayjs }) {
        const end = details.start.add(MEETING_DURATION_MINUTES, 'minute');

        const event = {
            summary: `Meeting with ${details.name}`,
            description: `Mobile: ${details.mobile}\nNotes: ${details.notes || 'None'}`,
            start: { 
                dateTime: getISOString(details.start),
                timeZone: TIMEZONE
            },
            end: { 
                dateTime: getISOString(end),
                timeZone: TIMEZONE
            },
            // attendees: [{ email: details.email }],
        };

        const result = await calendar.events.insert({
            calendarId: config.calendarId,
            requestBody: event,
        });

        return result.data;
    }
}
