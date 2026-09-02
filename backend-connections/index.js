import express from 'express';
import http from 'http';
import cors from 'cors';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import taskRouter from './routes/tasks.js';
import registerRouter from './routes/users.js';
import friendRouter from './routes/friends.js';
import authRouter from './routes/login.js';
import chatRouter from './routes/chatRooms.js';
import roomRouter from './routes/roomTasks.js';
import messageRouter from './routes/message.js';
import pool from './db/pool.js';

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET;
const corsOptions = {
    origin: ['http://localhost:5173', process.env.FRONTEND, process.env.HOST],
    credentials:true
};

app.use(express.json());
app.use(cors(corsOptions));

app.use('/task', taskRouter);
app.use('/users', registerRouter);
app.use('/login', authRouter);
app.use('/friend',friendRouter);
app.use('/chat', chatRouter);
app.use('/room', roomRouter);
app.use('/message', messageRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer:true });

server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const token = requestUrl.searchParams.get('token');

    if (requestUrl.pathname !== '/ws' || !token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        wss.handleUpgrade(request, socket, head, (ws) => {
            ws.user = user;
            wss.emit('connection', ws);
        });
    } catch {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
    }
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.send(
        JSON.stringify({
            type: 'connected',
            message: 'Welcome!'
        })
    );

    ws.on('message', async (data) => {
        let message;
        try {
            message = JSON.parse(data.toString());
        } catch {
            ws.send(JSON.stringify({type:'error', message:'Invalid message format'}));
            return;
        }

        if (message.type === 'join_room'){
            const membership = await pool.query(
                `SELECT 1 FROM room_members
                 WHERE room_id = $1 AND member_id = $2 AND member_accept = true`,
                [message.room_id, ws.user.id]
            );
            if (membership.rows.length === 0) {
                ws.send(JSON.stringify({type:'error', message:'Unauthorized room access'}));
                return;
            }
            ws.roomId = message.room_id;
        }
        if (message.type === 'leave_room'){
            ws.roomId = undefined;
        }
        console.log(message);

        if (message.type === 'new_message' && ws.roomId === message.room_id){
            const savedMessage = await pool.query(
                `SELECT m.message_id, m.room_id, m.messenger_id,
                        m.message_content, m.sent_at,
                        rm.member_display_name
                 FROM messages m
                 INNER JOIN room_members rm
                    ON rm.room_id = m.room_id AND rm.member_id = m.messenger_id
                 WHERE m.message_id = $1
                   AND m.room_id = $2
                   AND m.messenger_id = $3
                   AND rm.member_accept = true`,
                [message.message?.message_id, ws.roomId, ws.user.id]
            );
            if (savedMessage.rows.length === 0) {
                ws.send(JSON.stringify({type:'error', message:'Message was not authorized'}));
                return;
            }

            wss.clients.forEach((client) => {
                if(client.readyState === WebSocket.OPEN && client.roomId === ws.roomId){
                    client.send(
                        JSON.stringify({
                            type: 'new_message',
                            message: savedMessage.rows[0]
                        })
                    );
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

});


server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
});

export default app;