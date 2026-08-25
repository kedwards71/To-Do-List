import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticateToken } from '../auth.js';

const router = Router();


//Add a friend to your list
router.post('/', authenticateToken, async (req,res) => {
    const {
        user_id,
        friend_id,
        display_name,
        username,
        user_accept,
        friend_accept 

    } = req.body;
    try{
        const userExists = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if(userExists.rows.length === 0) {
            return res.status(404).json({error: 'User not found'});
        }

        const friendExists = await pool.query(
            `SELECT * FROM friend_list WHERE friend_id = $1 AND user_id = $2`,
            [req.user.id, userExists.rows[0].user_id]
        );
        const requestExists = await pool.query(
            `SELECT * FROM friend_list WHERE user_id = $1 AND friend_id = $2`,
            [req.user.id , userExists.rows[0].user_id]
        );
        if ((friendExists.rows.length > 0 && friendExists.rows[0].user_accept === true) && requestExists.rows.length > 0)
        {
            const addFriend = await pool.query(
                `UPDATE friend_list SET user_accept = true WHERE user_id = $1 AND friend_id = $2`,
                [req.user.id, userExists.rows[0].user_id]);

            const makeMutual = await pool.query(
                `UPDATE friend_list SET friend_accept = true WHERE friend_id = $1 AND user_id = $2`,
                [req.user.id, userExists.rows[0].user_id]);

            return res.status(201).json({accepted: addFriend.rows[0]});
        }
        else if(requestExists.rows.length !== 0){
            return res.status(409).send({error:'Request already sent'});
        }
        const result = await pool.query(
            `INSERT INTO friend_list (user_id, friend_id, display_name, user_accept, friend_accept)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
             [req.user.id, userExists.rows[0].user_id, display_name, user_accept, friend_accept]
        );
        const frequest = await pool.query(
            `INSERT INTO friend_list (user_id, friend_id, display_name, user_accept, friend_accept)
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [userExists.rows[0].user_id, req.user.id, req.user.username, friend_accept, user_accept]

        );
        console.log(result.rows[0]);
        console.log(frequest.rows[0]);
        return res.status(201).json({requester : result.rows[0], receiver: frequest.rows[0]});

    } catch (error) {
        console.error('Error adding friend', error.stack);
        return res.status(500).send({ error: 'Server error'});
    }
});

//Retrieve list of friends
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query (
            `SELECT * FROM friend_list WHERE user_id = $1`,[req.user.id]
        );
        if (result.rows.length === 0)
        {
            return res.status(404).json({error: 'No friends found'});
        }
        return res.status(201).json(result.rows);
    } catch (error) {
        console.error('Error creating task', error.stack);
        return res.status(500).send({error:'Server error'});
    }
});

//Delete a friend
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleter = await pool.query(
            `DELETE FROM friend_list WHERE user_id = $1 AND friend_id = $2 RETURNING*`,
            [req.user.id, req.params.id]
        );
        const deletee = await pool.query(
            `DELETE FROM friend_list WHERE friend_id = $1 AND user_id = $2 RETURNING *`,
            [req.user.id, req.params.id]
        );
        return res.status(201).json({message:'Friend successfully removed'})
    } catch (error) {
        console.error('Error removing friend', error.stack);
        return res.status(500).send({error:'Server error'});
    }
});

//Accept a friend
router.put('/accept', authenticateToken, async (req, res) => {
    try {
        console.log(req.body.friend_id)
        const receiver = await pool.query(
            `UPDATE friend_list SET user_accept = true WHERE user_id = $1 AND friend_id = $2 RETURNING *`,
            [req.user.id, req.body.friend_id]
        )
        const sender = await pool.query(
            `UPDATE friend_list SET friend_accept = true WHERE friend_id = $1 AND user_id = $2 RETURNING *`,
            [req.user.id, req.body.friend_id]
        )
        console.log(receiver.rows[0])
        console.log(sender.rows[0])
        return res.status(201).json({ receiver:receiver.rows[0], sender:sender.rows[0]});
    } catch (error) {
        console.error('Error accepting friend request', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

//Update a friends' display
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE friend_list SET 
            display_name = $1 WHERE user_id = $2 AND friend_id = $3 RETURNING *`,
            [req.body.display_name, req.user.id, req.params.id]
        );
        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error updating friend display', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
});

//Retrieve Friends Tasks
router.get('/tasks/:id', authenticateToken, async (req,res) => {
    
    try {
        const result = await pool.query(
            `SELECT * FROM tasks WHERE user_id = $1 `,[req.params.id]
        );
        if (result.rows.length === 0)
        {
            return res.status(404).json({error: 'No tasks found'});
        }
        res.status(201).send(result.rows);

    } catch (error) {
        console.error('Error fetching friends tasks', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
})

export default router;