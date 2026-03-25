import express from 'express';
import "dotenv";
import uploadRoutes from './routes/upload.routes';
import musicRoutes from './routes/music.routes';

const app= express();
const PORT= 3000;

app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/music', musicRoutes);

app.listen(PORT, ()=>{
    console.log("Server running on ", PORT)
})