import express from 'express';
import "dotenv";
import uploadRouters from './routes/upload.routes';

const app= express();
const PORT= 3000;

app.use(express.json());

app.use('/api/upload', uploadRouters);

app.listen(PORT, ()=>{
    console.log("Server running on ", PORT)
})