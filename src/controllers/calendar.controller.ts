import { Request, Response } from 'express';
import { CalendarService } from '../services/googleCalendar.service';
import { parseDateTime, formatDate, dayjs, roundToNextSlot } from '../utils/dateUtils';
import { getScheduleForDay, isWorkingDay, getNextWorkingDay, TIMEZONE } from '../config/schedule';

const calendarService = new CalendarService();

export class CalendarController {

    static getHealth(req: Request, res: Response) {
        res.status(200).json({ status: 'UP', message: 'Server is healthy' });
    }

    static async getUpcomingFreeSlots(req: Request, res: Response) {
        try {
            // Get current time in Asia/Kolkata timezone
            const now = dayjs.tz(TIMEZONE);
            const todayDayOfWeek = now.format('dddd');
            
            let checkDate: dayjs.Dayjs | null = null;
            let allSlots: string[] = [];
            const maxSlots = 4;
            let attempts = 0;
            const maxAttempts = 7; // Prevent infinite loop

            // Determine if we should check today
            if (isWorkingDay(todayDayOfWeek)) {
                const todaySchedule = getScheduleForDay(todayDayOfWeek);
                if (todaySchedule) {
                    const todayDateStr = now.format('DD/MM/YYYY');
                    const scheduleEnd = parseDateTime(todayDateStr, todaySchedule.end);
                    
                    // Check if current time is before schedule end time
                    if (now.isBefore(scheduleEnd)) {
                        // Check today starting from rounded current time
                        const startTime = roundToNextSlot(now);
                        const slots = await calendarService.findFreeSlots(startTime, scheduleEnd, maxSlots);
                        allSlots.push(...slots);
                    }
                }
            }

            // If we don't have enough slots, check subsequent working days
            if (allSlots.length < maxSlots) {
                // Start from next working day (skip today if we already checked it)
                checkDate = getNextWorkingDay(now);
                
                while (allSlots.length < maxSlots && checkDate && attempts < maxAttempts) {
                    const dayOfWeek = checkDate.format('dddd');
                    const daySchedule = getScheduleForDay(dayOfWeek);
                    
                    if (daySchedule) {
                        const dateStr = checkDate.format('DD/MM/YYYY');
                        const startTime = parseDateTime(dateStr, daySchedule.start);
                        const endTime = parseDateTime(dateStr, daySchedule.end);
                        
                        if (startTime.isValid() && endTime.isValid()) {
                            const slotsNeeded = maxSlots - allSlots.length;
                            const daySlots = await calendarService.findFreeSlots(startTime, endTime, slotsNeeded);
                            allSlots.push(...daySlots);
                        }
                    }
                    
                    // Move to next working day
                    checkDate = getNextWorkingDay(checkDate);
                    attempts++;
                }
            }

            // Limit to maxSlots and return
            const finalSlots = allSlots.slice(0, maxSlots);
            res.json({ slots: finalSlots });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch slots' });
        }
    }

    static async getFreeSlotsForDay(req: Request, res: Response) {
        try {
            const { date } = req.body;

            // Parse the date to get the day of the week
            const parsedDate = formatDate(date);
            const dayOfWeek = parsedDate.format('dddd'); // Returns "Monday", "Tuesday", etc.

            // Get the schedule for this day
            const daySchedule = getScheduleForDay(dayOfWeek);

            if (!daySchedule) {
                return res.status(400).json({
                    error: `No schedule configured for ${dayOfWeek}`,
                    message: 'This day is not a working day'
                });
            }

            const start = parseDateTime(date, daySchedule.start);
            const end = parseDateTime(date, daySchedule.end);

            if (!start.isValid() || !end.isValid()) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            const slots = await calendarService.findFreeSlots(start, end, 4);
            res.json({
                date,
                dayOfWeek,
                workingHours: daySchedule,
                slots
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch slots' });
        }
    }

    static async checkAvailability(req: Request, res: Response) {
        try {
            const { date, time } = req.body;
            const slotStart = parseDateTime(date, time);

            const isAvailable = await calendarService.checkAvailability(slotStart);

            res.json({
                slot: `${date} ${time}`,
                available: isAvailable,
                message: isAvailable ? 'Slot is free' : 'Slot is busy'
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to check availability' });
        }
    }

    static async createEvent(req: Request, res: Response) {
        try {
            const { name, email, mobile, notes, date, time } = req.body;
            const start = parseDateTime(date, time);

            // Double check availability before creating
            const isAvailable = await calendarService.checkAvailability(start);
            if (!isAvailable) {
                return res.status(409).json({ error: 'Slot is no longer available' });
            }

            const event = await calendarService.createEvent({ name, email, mobile, notes, start });

            res.json({
                message: 'Event created successfully',
                link: event.htmlLink
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create event' });
        }
    }
}
