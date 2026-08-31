import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../auth.js';
import { textAnalyzer } from '../textAnalyze.js';

const router = Router();

router.post('/task', authenticateToken, async(req,res) => {
    const {
        room_id,
        task_title,
        task_description,
        task_status,
        created_by,
        updated_by,
        category
    } = req.body
    try {
        const roomExists = await pool.query(
            `SELECT * FROM chat_rooms WHERE room_id = $1`,
            [room_id]
        );
        if(roomExists.rows.length === 0)
            return res.status(404).json({message:'Room not found'});
        const result = await pool.query(
            `INSERT INTO room_tasks
             (room_id, task_title, task_description, task_status, created_by, updated_by, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
             `,
             [room_id, task_title, task_description, task_status, created_by, updated_by, category]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({message: 'Server Error'});
    }
});

router.put('/task/:task_id', authenticateToken, async(req,res) => {
    const task_id = req.params.task_id;
    const {
        task_title,
        task_description,
        category,
        task_status
    } = req.body;
    try {
        const result = await pool.query(
            `UPDATE room_tasks SET
            task_title = $1,
            task_description = $2,
            task_status = $3,
            category = $4,
            updated_by = $5 WHERE task_id = $6 RETURNING * 
            `,
            [task_title, task_description, task_status, category, req.user.id, task_id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({message: 'Task not found'});
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error: ',error.stack);
        return res.status(500).send({message: 'Server Error'});
    }
});

router.get('/:room_id', authenticateToken, async(req,res) =>{
    try {
        const result = await pool.query(
            `SELECT * FROM room_tasks WHERE room_id = $1`,
            [req.params.room_id]
        )
        if (result.rows.length === 0)
            return res.status(404).json({message:'No tasks found.'})
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({message: 'Server Error'});
    }
})

export default router;