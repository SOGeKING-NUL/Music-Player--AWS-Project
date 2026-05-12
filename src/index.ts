import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import musicRoutes from './routes/music.routes';
import sessionRoutes from './routes/session.routes';

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // CRITICAL: Listen on all interfaces for Docker/ECS

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

// Health check endpoint for ALB/ECS
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Music Player API',
        version: '1.0.0'
    });
});

app.listen(Number(PORT), HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
