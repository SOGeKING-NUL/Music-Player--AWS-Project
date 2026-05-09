import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import musicRoutes from './routes/music.routes';
import sessionRoutes from './routes/session.routes';

const app = express();
const PORT = 3000;

// Allow cookies to be sent from the frontend dev server
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/upload', uploadRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/session', sessionRoutes);

app.listen(PORT, () => {
    console.log("Server running on", PORT);
});