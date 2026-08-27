import request from 'supertest';
import app from '../index.js';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

describe('[GET, POST, UPDATE, DELETE] /friend (protected)', () => {
    let token;
    let token2;
    let targetId;
    beforeAll(async () => {
        const res = await request(app)
            .post('/login')
            .send({username: 'khae', password: 'test'});
        token = res.body.token;
        const res2 = await request(app)
            .post('/login')
            .send({username: 'TheBlueJay', password: '1234'});
        token2 = res2.body.token;
    });

    it('should return the list of friends with a valid token', async () => {
        const res = await request(app)
            .get('/friend')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    it('should fail without a token', async () => {
        const res = await request(app)
            .get('/friend');
        expect(res.statusCode).toBe(401);
    });

    it('shoud fail with an invalid token', async() => {
        const res = await request(app)
            .get('/friend')
            .set('Authorization', `Bearer dummyToken`);
        expect(res.statusCode).toBe(403);
    });

    it("should post add a person to a friend's list if the username is valid", async () => {
        const res = await request(app)
            .post('/friend')
            .set('Authorization', `Bearer ${token}`)
            .send({username:'TheBlueJay', user_accept:true, friend_accept:false});
        expect(res.statusCode).toBe(201);
        targetId = res.body.requester.friend_id;
    });

    it("should fail because a request is already pending", async() =>{
        const res = await request(app)
            .post('/friend')
            .set('Authorization', `Bearer ${token}`)
            .send({username:'TheBlueJay', user_accept:true, friend_accept:false})
        expect(res.statusCode).toBe(409);
    });

    it("should succeed and change the display name to 'TheRedDoor' ", async()=>{
        const res = await request(app)
            .put(`/friend/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({display_name:'TheRedDoor'});
        expect(res.statusCode).toBe(201);
        expect(res.body.display_name).toBe('TheRedDoor');
    })

    it('should succeed with a 201 and an "accepted" attribute', async() => {
        const res = await request(app)
            .post('/friend')
            .set('Authorization', `Bearer ${token2}`)
            .send({username:'khae', user_accept:true, friend_accept: false});
        expect(res.statusCode).toBe(201);
        expect(res.body.accepted).toBeDefined();
    });

    it('should succeed with a status of 201 and a message', async() => {
        const res = await request(app)
            .delete(`/friend/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBeDefined();
    });
});