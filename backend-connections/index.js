import express from 'express';
import http from 'http';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import 'dotenv/config';
import { detectEmotions } from './textAnalyze.js'
import { authenticateToken } from './auth.js';

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const corsOptions = {
    origin: ['http://localhost:5173', 'https://challenge-each-implode.ngrok-free.dev', process.env.HOST],
    credentials:true
};

app.use(express.json());
app.use(cors(corsOptions));

// PostGres Credentials
const pool = new Pool({
    user: process.env.USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: 5432
});


// Emotion Detector for messages
const textAnalyzer = async (comments) => {
    try {
        let updatedComments = []
        await comments.map( async (c) => {
            if(c.emotion === null){
                const emotion = await detectEmotions(c.task_comment);
                let strongestEmote = {
                    "emotion" : '',
                    "score" : 0
                }
                for (let key in emotion.confidence_scores){
                    if(strongestEmote.score < emotion.confidence_scores[key])
                    {
                        strongestEmote.emotion = key;
                        strongestEmote.score = emotion.confidence_scores[key];
                    }
                }
                const result = await pool.query(
                    `UPDATE task_comments SET 
                    emotion = $1 WHERE task_id = $2 AND comment_id = $3 RETURNING *`,
                    [strongestEmote.emotion, c.task_id, c.comment_id]
                );
                updatedComments = [...updatedComments, result.rows[0]];
            }
            else{
                updatedComments = [...updatedComments, c];
            }
        })
        return updatedComments;
    } catch (error) {
        try{
            const emotion = await detectEmotions(comments.task_comment);
            let strongestEmote = {
                "emotion" : '',
                "score" : 0
            }
            for (let key in emotion.confidence_scores){
                if(strongestEmote.score < emotion.confidence_scores[key])
                {
                    strongestEmote.emotion = key;
                    strongestEmote.score = emotion.confidence_scores[key];
                }
            }
            const result = await pool.query(
                `UPDATE task_comments SET
                emotion = $1 WHERE task_id = $2 AND comment_id = $3 RETURNING *`,
                [strongestEmote.emotion, comments.task_id, comments.comment_id]
    
            );
            return result.rows[0];
        }
        catch (err) {
            console.error('Error: ', err.stack)
        }
    }
}


//Connection test
(async () =>{
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Connected to Postgres at:', res.rows[0].now);
    }
    catch (err) {
        console.error('Error running test query', err.stack);
    }
})();

app.get('/', (req,res) => {
    return res.status(200).send('Khaemon your first express server! ^_^');
});

//Create a new user
app.post('/users', async (req,res) => {
    const {username, email, age, password} = req.body;
    const encryptPassword = await bcrypt.hash(password,10);
    try {
        const result = await pool.query(
            `INSERT INTO users (username, email, age, password)
             VALUES ($1, $2, $3, $4) RETURNING *`,
             [username, email, age, encryptPassword]
        );
        const user = result.rows[0];
        console.log(user);
        const token = jwt.sign({id: user.id ? user.id : user.user_id, username: result.rows[0].username}, JWT_SECRET, {expiresIn: '1h'});
        res.status(201).json({token});
    } catch (error) {
        console.error('Error creating user', error.stack);
        res.status(500).send('Error creating user');
    }
});

//Login to an established user
app.post('/login', async (req,res) =>{
    const {username, password} = req.body;
    console.log(JSON.stringify(req.body,null,4))
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 ', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({error: 'User not found'});
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        const token = jwt.sign({id: user.id ? user.id : user.user_id, username: user.username}, JWT_SECRET, {expiresIn: '1h'});
        console.log(token)
        res.status(200).json({token});

    } catch (error) {
        console.error('Error logging in', error.stack);
        res.status(500).send({ error: 'Server error'});
    }
});

//Add a friend to your list
app.post('/friend', authenticateToken, async (req,res) => {
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
app.get('/friend', authenticateToken, async (req, res) => {
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
app.delete('/friend/:id', authenticateToken, async (req, res) => {
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
app.put('/friend/accept', authenticateToken, async (req, res) => {
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
app.put('/friend/:id', authenticateToken, async (req, res) => {
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

// Add a task
app.post('/task', authenticateToken, async (req, res) =>{
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
app.delete('/task/:id', authenticateToken, async (req, res) => {
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
app.put('/task/:id', authenticateToken, async (req, res) => {
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
})

//Update a task's acceptance
app.put('/task/accept/:id', authenticateToken ,async (req,res) =>{
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
})

//Delete a task by the category
app.delete('/task', authenticateToken, async (req, res) => {
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
})

//Fetch tasks for a specific user
app.get('/task', authenticateToken, async (req, res) => {
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
})

//Fetch tasks for a specific user 'friend route'
app.get('/friend/tasks/:friend_id', authenticateToken, async (req,res) => {
    console.log('In here')
    try {
        const result = await pool.query(
            `SELECT * FROM tasks WHERE owner_id = $1`, [req.params.friend_id]
        )
        console.log(result.rows)
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks', error.stack);
        return res.status(500).send({error: 'Server error'});
    }
})

// Add a comment to a task
app.post('/task/:task_id/comment', authenticateToken, async (req, res) => {
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

app.delete('/task/comment/:comment_id', authenticateToken, async (req,res) =>{
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
app.get('/task/:task_id/comment', authenticateToken, async (req,res) => {
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

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
});