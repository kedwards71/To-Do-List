import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../auth.js';

const router = Router();

router.post('/', authenticateToken, async (req,res) => {
    const {
        room_id,
        message_content
    } = req.body
    const messenger_id = req.user.id;

    try {
        const isMember = await pool.query(
            `SELECT * FROM room_members
             WHERE room_id = $1 AND member_id = $2 AND member_accept = true`,
            [room_id,messenger_id]
        )
        if (isMember.rows.length === 0){
            return res.status(403).json({message:'Unauthorized access.'});
        }
        const result = await pool.query(
            `INSERT INTO messages (room_id, messenger_id, message_content)
             VALUES ($1, $2, $3) RETURNING *`,
             [room_id, messenger_id, message_content]
        );
        return res.status(201).json({message:result.rows[0],name:isMember.rows[0].member_display_name});
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({message:'Server error.'});
    }
});

router.get('/:room_id', authenticateToken, async(req,res) => {
    try{
        const isMember = await pool.query(
            `SELECT 1 FROM room_members
             WHERE room_id = $1 AND member_id = $2 AND member_accept = true`,
            [req.params.room_id, req.user.id]
        );
        if (isMember.rows.length === 0) {
            return res.status(403).json({message:'Unauthorized access.'});
        }

        const result = await pool.query(
            `SELECT
            m.message_id,
            m.room_id,
            m.messenger_id,
            m.message_content,
            m.sent_at,
            room_members.member_display_name
            FROM messages m
            INNER JOIN chat_rooms ON 
            chat_rooms.room_id = m.room_id
            INNER JOIN room_members ON
            room_members.member_id = m.messenger_id
            AND
            room_members.room_id = chat_rooms.room_id
            WHERE m.room_id = $1`,
            [req.params.room_id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({message:'Room not found'});
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error: ',error.stack);
        return res.status(500).send({message:'Server error.'});
    }
});

export default router;