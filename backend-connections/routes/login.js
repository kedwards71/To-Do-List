import { Router } from 'express';
import pool from '../db/pool.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

//Login to an established user
router.post('/', async (req,res) =>{
    const {username, password} = req.body;
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
        res.status(200).json({token});

    } catch (error) {
        console.error('Error logging in', error.stack);
        res.status(500).send({ error: 'Server error'});
    }
});

export default router;