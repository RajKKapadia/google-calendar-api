import { z } from 'zod';

// Regex for DD/MM/YYYY
const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
// Regex for HH:mm (24h)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const dateSchema = z.string().regex(dateRegex, "Date must be DD/MM/YYYY");
export const timeSchema = z.string().regex(timeRegex, "Time must be HH:mm");

export const daySlotsSchema = z.object({
    date: dateSchema,
});

export const checkAvailabilitySchema = z.object({
    date: dateSchema,
    time: timeSchema,
});

export const createEventSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    mobile: z.string().min(10),
    notes: z.string().optional(),
    date: dateSchema,
    time: timeSchema,
});
