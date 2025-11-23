# Google Calendar API

A RESTful API service for managing Google Calendar availability and scheduling. This Node.js/Express backend provides endpoints to check free time slots, verify availability, and create calendar events with automatic conflict detection.

## Features

- **Find Free Slots** - Get available time slots within a specified date and time range
- **Daily Availability** - Check free slots for a specific day (default working hours 9 AM - 5 PM)
- **Availability Check** - Verify if a specific time slot is available
- **Event Creation** - Schedule calendar events with automatic conflict checking
- **API Key Authentication** - Secure endpoints with custom API key protection
- **Request Validation** - Zod schema validation for all incoming requests
- **15-Minute Meetings** - Optimized for standard 15-minute appointment slots

## Tech Stack

- **Node.js** + **Express.js** v5.1.0 - Web server framework
- **TypeScript** v5.9.3 - Type safety and modern JavaScript
- **Google Calendar API** - Official googleapis client v166.0.0
- **Zod** v4.1.12 - Runtime schema validation
- **Day.js** v1.11.19 - Date manipulation and formatting
- **Helmet** + **CORS** - Security middleware

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v18+ installed
- **pnpm** v10.22.0 (or npm/yarn)
- A **Google Cloud Project** with Calendar API enabled
- A **Service Account** with calendar access

### Setting Up Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**
4. Create a **Service Account**:
   - Navigate to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Download the JSON key file
5. Share your Google Calendar with the service account email
   - Open Google Calendar settings
   - Share calendar with the service account email
   - Grant "Make changes to events" permission

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd google-calendar-api
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your credentials**
   ```env
   PORT=3000
   API_KEY=your-secure-api-key
   CALENDAR_ID=your-email@gmail.com
   GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   **Note:** Copy the entire private key from your service account JSON file, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Keep the `\n` characters as-is.

## Running the Application

### Development Mode (with hot reload)
```bash
pnpm dev
# or
npm run dev
```

### Production Build
```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Documentation

All endpoints except `/health` require authentication via `x-api-key` header.

### Base URL
```
http://localhost:3000/api
```

### Authentication
Include the API key in request headers:
```
x-api-key: your-secure-api-key
```

---

### 1. Health Check

Check if the service is running.

**Endpoint:** `GET /api/health`

**Authentication:** Not required

**Response:**
```json
{
  "status": "OK",
  "message": "Calendar API is running"
}
```

---

### 2. Get Upcoming Free Slots

Find available time slots within a date and time range.

**Endpoint:** `POST /api/upcoming-free-slots`

**Headers:**
```
x-api-key: your-secure-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "25/12/2024",
  "start_time": "09:00",
  "end_time": "17:00"
}
```

**Response:**
```json
{
  "freeSlots": [
    "2024-12-25 09:00",
    "2024-12-25 11:30",
    "2024-12-25 14:15",
    "2024-12-25 16:00"
  ]
}
```

**Notes:**
- Returns up to 4 random available slots
- Slots are 15 minutes long
- Date format: `DD/MM/YYYY`
- Time format: `HH:mm` (24-hour)

---

### 3. Get Free Slots for Day

Find available slots for a specific day (default 9 AM - 5 PM).

**Endpoint:** `POST /api/free-slots-for-day`

**Headers:**
```
x-api-key: your-secure-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "day": "25/12/2024"
}
```

**Response:**
```json
{
  "freeSlots": [
    "2024-12-25 09:00",
    "2024-12-25 10:30",
    "2024-12-25 13:45",
    "2024-12-25 15:30"
  ]
}
```

---

### 4. Check Availability

Verify if a specific time slot is available.

**Endpoint:** `POST /api/check-availability`

**Headers:**
```
x-api-key: your-secure-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "day": "25/12/2024",
  "time": "14:00"
}
```

**Response (Available):**
```json
{
  "available": true
}
```

**Response (Busy):**
```json
{
  "available": false
}
```

---

### 5. Create Event

Schedule a new calendar event with conflict checking.

**Endpoint:** `POST /api/create-event`

**Headers:**
```
x-api-key: your-secure-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "notes": "Discuss project requirements",
  "day": "25/12/2024",
  "time": "14:00"
}
```

**Response (Success):**
```json
{
  "message": "Event created successfully",
  "event": {
    "id": "event_id_123",
    "summary": "Meeting with John Doe",
    "start": {
      "dateTime": "2024-12-25T14:00:00+00:00"
    },
    "end": {
      "dateTime": "2024-12-25T14:15:00+00:00"
    }
  }
}
```

**Response (Conflict):**
```json
{
  "error": "Slot is no longer available"
}
```
HTTP Status: `409 Conflict`

---

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "error": "Validation Error",
  "details": [
    {
      "code": "invalid_string",
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized - Missing or Invalid API Key
```json
{
  "error": "Unauthorized: Invalid API Key"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch free slots"
}
```

## Project Structure

```
src/
├── server.ts                          # Application entry point
├── app.ts                             # Express app configuration
├── config/
│   └── env.ts                         # Environment variable management
├── controllers/
│   └── calendar.controller.ts         # Request handlers
├── services/
│   └── googleCalendar.service.ts      # Google Calendar API integration
├── routes/
│   └── calendar.routes.ts             # Route definitions
├── middlewares/
│   ├── auth.middleware.ts             # API key authentication
│   └── validate.middleware.ts         # Request validation
├── schemas/
│   └── calendar.schema.ts             # Zod validation schemas
└── utils/
    └── dateUtils.ts                   # Date parsing utilities
```

## Development

### Code Quality
- TypeScript for type safety
- Zod for runtime validation
- Express 5.x with async/await support

### Security Features
- Helmet.js for HTTP security headers
- CORS protection
- API key authentication
- Input validation and sanitization

### Meeting Logic
- 15-minute appointment slots
- Automatic conflict detection
- Optimistic concurrency control
- Randomized slot selection to distribute availability

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
