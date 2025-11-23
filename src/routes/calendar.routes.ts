import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { apiKeyAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
    daySlotsSchema,
    checkAvailabilitySchema,
    createEventSchema
} from '../schemas/calendar.schema';

const router = Router();

// Public Route
router.get('/health', CalendarController.getHealth);

// Protected Routes
router.use(apiKeyAuth);

// GET route - no body required
router.get(
    '/upcoming-free-slots',
    CalendarController.getUpcomingFreeSlots
);

// POST used for all below to satisfy "all request will have body" requirement
router.post(
    '/free-slots-day',
    validate(daySlotsSchema),
    CalendarController.getFreeSlotsForDay
);

router.post(
    '/check-availability',
    validate(checkAvailabilitySchema),
    CalendarController.checkAvailability
);

router.post(
    '/create-event',
    validate(createEventSchema),
    CalendarController.createEvent
);

export default router;
