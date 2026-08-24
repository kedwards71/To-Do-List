import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../auth.js';
import { textAnalyzer } from '../textAnalyze.js';
const router = Router();


// Add a task
router.post('/', authenticateToken, async (req, res) =>{
    const {task_title, 
            task_description, 
            created_by, 
            owner_id,
        } = req.body;
        console.log(created_by);
    let task_status = req.body.task_status !== '' ? req.body.task_status : 'Not started'
    let category = req.body.category !== "" ? req.body.category : "General";
    try {
        const acceptance = owner_id === created_by ? true : false;
        if(owner_id !== created_by){
            const ownerExists = await pool.query(
                `SELECT * FROM users WHERE user_id = $1`, [owner_id]
            );
            if( ownerExists.rows.length === 0)
                return res.status(404).json({error: 'Owner not found'});
        }
        const result = await pool.query(
            `INSERT INTO tasks (task_title, task_description, created_by, owner_id, acceptance, category, task_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
             [task_title, task_description, created_by, owner_id, acceptance, category, task_status]
        );
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating task', error.stack);
        return res.status(500).send({ error: 'Server error'});
    }
});

// Delete a task by the Id
router.delete('/:id', authenticateToken, async (req, res) => {
    const taskId = req.params.id;
    try{
        const result = await pool.query(
            `DELETE FROM tasks WHERE task_id = $1`, [taskId]
        );
        return res.status(201).json({message: 'Task deleted successfully'});
    } catch (error) {
        console.error('Error deleting task', error.stack);
        return res.status(500).send({error:'Server error'});
    }
});

// Update a task by the Id
router.put('/:id', authenticateToken, async (req, res) => {
    const taskId = req.params.id;
    const {task_title, task_description, category, task_status} = req.body
    console.log(req.body)
    try{
        const result = await pool.query(
            `UPDATE tasks SET 
            task_title=$1, 
            task_description=$2, 
            task_status=$3, 
            category=$4 WHERE task_id = $5 RETURNING *`,
            [task_title, task_description, task_status, category, taskId]
        );
        return res.status(201).json(result.rows[0])
    } catch (error){
        console.error('Error updating task', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

//Update a task's acceptance
router.put('/accept/:id', authenticateToken ,async (req,res) =>{
    try{
        const result = await pool.query(
            `UPDATE tasks SET acceptance = $1, task_status = $2 WHERE task_id = $3 RETURNING *`,
            [true, 'Not started', req.params.id]
        )
        console.log(result.rows[0])
        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error while updating task', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

//Delete a task by the category
router.delete('/', authenticateToken, async (req, res) => {
    const category = req.query.category;
    try {
        const result = await pool.query(
            `DELETE FROM tasks WHERE category = $1`, [category]
        );
        return res.status(201).json({message: 'Category deleted successfully'});

    } catch (error) {
        console.error('Error deleting task', error.stack);
        return res.status(500).send({error: 'Server error'})
    }
});

//Fetch tasks for a specific user
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.query.user;
    try{
        const result = await pool.query(
            `SELECT * FROM tasks WHERE owner_id = $1`, [userId]
        )
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching task', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});


// Add a comment to a task
router.post('/:task_id/comment', authenticateToken, async (req, res) => {
    const task_id = req.params.task_id;
    const {task_comment} = req.body;
    const commenter_id = req.user.id
    try {
        const taskExists = await pool.query(
            `SELECT * FROM tasks WHERE task_id = $1`, [task_id]
        );
        const commenterExists = await pool.query(
            `SELECT * FROM users WHERE user_id = $1`, [commenter_id]
        );
        if (taskExists.rows.length === 0) {
            return res.status(404).json({error: 'Task not found'});
        }
        const result = await pool.query(
            `INSERT INTO task_comments (task_id, commenter_id, task_comment)
             VALUES ($1, $2, $3) RETURNING *`,
             [task_id, commenter_id, task_comment]
        );
        const analysis = await textAnalyzer(result.rows[0])
        return res.status(201).json({comment : analysis, commenter : commenterExists.rows[0]});
    } catch (error) {
        console.error('Error adding comment', error.stack);
        return res.status(500).send({error: 'Server error'});
    }

});

router.delete('/comment/:comment_id', authenticateToken, async (req,res) =>{
    try {
        const result = await pool.query(
            `DELETE FROM task_comments WHERE comment_id = $1`, [req.params.comment_id]
        )

        return res.status(201).json({message:'Successful deletion'});
    } catch (error) {
        console.error('Error deleting comment', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});


// Fetch Comments for a specific task
router.get('/:task_id/comment', authenticateToken, async (req,res) => {
    try {
        const result = await pool.query (
            `SELECT 
                comment_id, commenter_id, created_at, 
                task_comment, task_id, username as commenter,
                emotion 
                FROM task_comments 
                inner join users on 
                task_comments.commenter_id = users.user_id
                WHERE task_id = $1`, [req.params.task_id]
        );
        const textAnalysis = await textAnalyzer(result.rows);
        console.log(textAnalysis);
        return res.status(201).json(textAnalysis)
    } catch (error) {
        console.error('Error fetching comments', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

export default router;