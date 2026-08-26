import request from 'supertest';
import app from '../index.js';
import pool from '../db/pool.js';

describe("POST /login", () => {
    it("should return a JWT token", async () => {
        const res = await request(app)
            .post('/login')
            .send({username: 'khae', password: "test"});
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });


    it("should fail with wrong password", async () => {
        const res = await request(app)
            .post('/login')
            .send({username: 'khae', password: 'jibberish'});

        expect(res.statusCode).toBe(401)
    });
});

describe("POST /users", () => {
    it("should fail because the username is already in use", async () => {
        const res = await request(app)
            .post('/users')
            .send({username: 'khae', age:32, email:'kha25e@t.com', password: 'test'});
        expect(res.statusCode).toBe(409);
        expect(res.body.token).toBeUndefined();
    });

    it("should fail because the email is already in use", async () => {
        const res = await request(app)
            .post('/users')
            .send({username:'suprememBubbles', age:42, email:'J@j.com', password: '1234'})
        expect(res.statusCode).toBe(409);
        expect(res.body.token).toBeUndefined();        
    });

    it("should succeed with a 201", async () => {
        const res = await request(app)
            .post('/users')
            .send({username:'supremeBubbles', age:42, email:'supremeBubbles@s.com', password: 'bubbleMan'});
        expect(res.statusCode).toBe(201);
        expect(res.body.token).toBeDefined();
        await pool.query(
            `DELETE FROM users WHERE username = $1`, ['supremeBubbles']
        );
    });
});
