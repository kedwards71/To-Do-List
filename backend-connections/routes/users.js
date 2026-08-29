import { Router } from 'express';
import pool from '../db/pool.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { authenticateToken } from '../auth.js';


const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';



//Create a new user
router.post('/', async (req,res) => {
    const {username, email, age, password} = req.body;
    const encryptPassword = await bcrypt.hash(password,10);
    try {
        const userExists = await pool.query(
            `SELECT * FROM users WHERE username = $1 or email = $2`, [username,email]
        );
        if (userExists.rows.length > 0)
            return res.status(409).send('Username')
        const result = await pool.query(
            `INSERT INTO users (username, email, age, password)
             VALUES ($1, $2, $3, $4) RETURNING *`,
             [username, email, age, encryptPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign({id: user.id ? user.id : user.user_id, username: result.rows[0].username}, JWT_SECRET, {expiresIn: '1h'});
        return res.status(201).json({token});
    } catch (error) {
        console.error('Error creating user', error.stack);
        return res.status(500).send('Error creating user');
    }
});

//Get user by username
router.get('/:username', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE username = $1`, [req.params.username]
        );
        if(result.rows.length === 0)
            return res.status(404).json({message : 'User not found'})
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error searching for user', error.stack);
        return res.status(500).send('Error searching for user');
    }
});


export default router;