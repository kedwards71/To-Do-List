import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../auth.js';
import { textAnalyzerRoom } from '../textAnalyze.js';

const router = Router();
// Create a task for a room
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
// Update a ask for a room
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
//Get all tasks for a room
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
});
// Delete all tasks in a room by category
router.delete('/', authenticateToken, async (req, res) => {
    console.log('eere')
    try {
        const result = await pool.query(
            `DELETE FROM room_tasks WHERE category = $1 AND room_id = $2 RETURNING *`,
            [req.query.category, req.query.chatroom]
        );
        if (result.rows.length === 0)
            return res.status(404).json({message:'Record not found'});
        return res.status(201).json({message:'Category successfully deleted'});
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({message: 'Server error'});
    }
});
// Delete a specific task for a room
router.delete('/task/:task_id', authenticateToken, async (req,res) => {
    try {
        const result = await pool.query(
            `DELETE FROM room_tasks WHERE task_id = $1 RETURNING *`,
            [req.params.task_id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({message: 'Record not found'});
        return res.status(201).json({message:'Task successfully deleted.'});
    } catch (error) {
        console.error('Error: ', error.stack);
        return res.status(500).send({message: 'Server error'});
    }
});

// Add a comment to a task
router.post('/task/:task_id/comment', authenticateToken, async (req, res) => {
    const task_id = req.params.task_id;
    const {task_comment} = req.body;
    const commenter_id = req.user.id
    let canComment = false;
    try {
        const taskExists = await pool.query(
            `SELECT * FROM room_tasks WHERE task_id = $1`, [task_id]
        );
        const commenterExists = await pool.query(
            `SELECT * FROM users WHERE user_id = $1`, [commenter_id]
        );
        if (taskExists.rows.length === 0) {
            return res.status(404).json({error: 'Task not found'});
        }
        if (taskExists.rows[0].owner_id === commenter_id)
            canComment = true;
        else{
            const isMember = await pool.query(
                `SELECT * FROM room_members WHERE room_id = $1 AND member_id = $2`,
                [req.body.room_id, commenter_id]
            );
            if(isMember.rows.length > 0 && isMember.rows[0].member_accept === true)
                canComment = true;
        }
        if(!canComment)
            return res.status(403).send({message:"You don't have access to this comment"});
        const result = await pool.query(
            `INSERT INTO room_task_comments (task_id, commenter_id, task_comment)
             VALUES ($1, $2, $3) RETURNING *`,
             [task_id, commenter_id, task_comment]
        );
        console.log(result.rows[0]);
        const analysis = await textAnalyzerRoom(result.rows[0])
        return res.status(201).json({comment : analysis, commenter : commenterExists.rows[0]});
    } catch (error) {
        console.error('Error adding comment', error.stack);
        return res.status(500).send({error: 'Server error'});
    }

});
// Delete Comment from a task
router.delete('/task/comment/:comment_id', authenticateToken, async (req,res) =>{
    try {
        const result = await pool.query(
            `DELETE FROM room_task_comments WHERE comment_id = $1`, [req.params.comment_id]
        )

        return res.status(201).json({message:'Successful deletion'});
    } catch (error) {
        console.error('Error deleting comment', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});


// Fetch Comments for a specific task
router.get('/task/:task_id/comment', authenticateToken, async (req,res) => {
    try {
        const result = await pool.query (
            `SELECT 
            rtc.comment_id,
            rtc.commenter_id,
            rtc.created_at,
            rtc.task_comment,
            rtc.task_id,
            rm.member_display_name AS commenter,
            rtc.emotion
            FROM room_task_comments rtc
            INNER JOIN room_tasks rt
                ON rtc.task_id = rt.task_id
            INNER JOIN room_members rm
                ON rtc.commenter_id = rm.member_id
                AND rm.room_id = rt.room_id
            WHERE rtc.task_id = $1;`, 
            [req.params.task_id]
        );
        const textAnalysis = await textAnalyzerRoom(result.rows);
        return res.status(200).json(textAnalysis)
    } catch (error) {
        console.error('Error fetching comments', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});


export default router;