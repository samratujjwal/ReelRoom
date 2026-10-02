import express from 'express';
import cors from 'cors';
import roomRoutes from './routes/roomRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
const app = express();
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000', // local url
            'https://syncstream-38id.onrender.com', // Vercel URL 
        ];
        // No origin (mobile/curl) OR allowed origin allow
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, true); // development ke liye sab allow 
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Register API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
// Root route welcome message
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to ReelRoom Backend API',
        health: '/api/v1/health',
        authApi: '/api/v1/auth',
        roomsApi: '/api/v1/rooms'
    });
});
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});
export default app;
