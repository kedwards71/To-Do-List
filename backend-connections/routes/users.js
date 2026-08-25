import { Router } from 'express';
import pool from '../db/pool.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';


const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';



//Create a new user
router.post('/', async (req,res) => {
    const {username, email, age, password} = req.body;
    const encryptPassword = await bcrypt.hash(password,10);
    try {
        const result = await pool.query(
            `INSERT INTO users (username, email, age, password)
             VALUES ($1, $2, $3, $4) RETURNING *`,
             [username, email, age, encryptPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign({id: user.id ? user.id : user.user_id, username: result.rows[0].username}, JWT_SECRET, {expiresIn: '1h'});
        res.status(201).json({token});
    } catch (error) {
        console.error('Error creating user', error.stack);
        res.status(500).send('Error creating user');
    }
});


export default router;