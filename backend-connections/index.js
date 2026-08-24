import express from 'express';
import http from 'http';
import cors from 'cors';
import 'dotenv/config';
import taskRouter from './routes/tasks.js';
import registerRouter from './routes/users.js';
import friendRouter from './routes/friends.js';
import authRouter from './routes/login.js';

const app = express();
const PORT = process.env.PORT || 8000;
const corsOptions = {
    origin: ['http://localhost:5173', 'https://challenge-each-implode.ngrok-free.dev', process.env.HOST],
    credentials:true
};

app.use(express.json());
app.use(cors(corsOptions));

app.use('/task', taskRouter);
app.use('/users', registerRouter);
app.use('/login', authRouter);
app.use('/friend',friendRouter);

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
});