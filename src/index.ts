import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import uploadRoutes from './routes/upload.routes';
import musicRoutes from './routes/music.routes';

const app= express();
const PORT= 3000;

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/music', musicRoutes);

app.listen(PORT, ()=>{
    console.log("Server running on ", PORT)
})