import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import calendarRoutes from './routes/calendar.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', calendarRoutes);

export default app;
