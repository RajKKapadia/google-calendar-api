import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
    throw new Error('Missing Google Service Account Credentials in .env');
}

export const config = {
    port: process.env.PORT || 3000,
    apiKey: process.env.API_KEY || 'default-key',
    calendarId: process.env.CALENDAR_ID || 'primary',
    google: {
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        // Handle newlines in private key string from .env
        privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
};
