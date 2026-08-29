import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../auth.js';

const router = Router();

//Add a Chat Room
router.post('/', authenticateToken, async (req,res) =>{
    const {room_name} = req.body;
    try {
        const result = await pool.query(
          `INSERT INTO chat_rooms (room_name, room_owner)
           VALUES ($1, $2) RETURNING *`,
           [room_name, req.user.id]
        );
        await pool.query(
            `INSERT INTO room_members (room_id, member_id, member_display_name, member_accept)
             VALUES ($1, $2, $3, $4) RETURNING *`,
             [result.rows[0].room_id, req.user.id, req.user.username, true]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating room', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

//Add a member to a room
router.post('/:room_id', authenticateToken, async(req,res) => {
    const {
        friend_id,
        display_name
    } = req.body
    try {
        const roomExists = await pool.query(
            `SELECT * FROM chat_rooms where room_id = $1`, [req.params.room_id]
        );
        if (roomExists.rows.length === 0)
            return res.status(404).json({message: 'Room not found'});
        const personExists = await pool.query(
            `SELECT * FROM users where user_id = $1`, [friend_id]
        );
        if (personExists.rows.length === 0)
            return res.status(404).json({message: 'Person not found'});
        const result = await pool.query(
            `INSERT INTO room_members 
             (room_id, member_id, member_display_name, member_accept)
             VALUES ($1, $2, $3, $4) RETURNING *`,
             [req.params.room_id, friend_id, display_name, false]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

// Get Chat rooms
router.get('/', authenticateToken, async(req,res) => {
    try {
        const rooms = await pool.query(
            `SELECT * FROM chat_rooms 
            INNER JOIN room_members
            ON chat_rooms.room_id = room_members.room_id
            WHERE room_members.member_id = $1`,
            [req.user.id]
        );
        if (rooms.rows.length === 0)
            return res.status(404).json({message:'No rooms found'});
        const members = await pool.query(
            `SELECT * FROM room_members
             WHERE room_id IN (
                SELECT room_id
                FROM room_members
                WHERE member_id = $1
             )
            `,
            [req.user.id]
        );
        return res.status(200).json({rooms: rooms.rows, members: members.rows});
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

export default router;