import request from 'supertest';
import app from '../index.js';
import 'dotenv/config';

describe('[GET,POST,PUT,DELETE] (protected)', () => {
    let token;
    let token2;
    let targetId;

    beforeAll(async () =>{
        const res = await request(app)
            .post('/login')
            .send({username: 'khae', password: 'test'});
        token = res.body.token;

        const res2 = await request(app)
            .post('/login')
            .send({username: 'TheBlueJay', password: '1234'});
        token2 = res2.body.token;
    });

    it('should succeed with a status of 200 if the task exists', async () =>{
        const res = await request(app)
            .get('/task/76/comment')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200);
    });

    it('should fail with a 403 if invalid token', async () => {
        const res = await request(app)
            .get('/task/76/comment')
            .set('Authorization', `Bearer fakeToken`)
        expect(res.statusCode).toBe(403);
    });

    it('should return a 404 if task not found', async () => {
        const res = await request(app)
            .post('/task/93332/comment')
            .set('Authorization', `Bearer ${token}`)
            .send({task_comment:'This is a test comment'});
        expect(res.statusCode).toBe(404);
    })

    it('should succeed with a valid token and return a 201 code because this is the owner of the task', async () => {
        const res = await request(app)
            .post(`/task/${76}/comment`)
            .set('Authorization', `Bearer ${token}`)
            .send({task_comment:'This is a test comment'});
        expect(res.statusCode).toBe(201);
        targetId = res.body.comment.comment_id;
    });

    it('should fail with a status code of 403 because the user is not a mutal friend of the owner', async () => {
        const res = await request(app)
            .post('/task/76/comment')
            .set('Authorization', `Bearer ${token2}`)
            .send({task_comment: 'This is another test comment'});
        expect(res.statusCode).toBe(403);
    });

    it('should succeed with a status code of 201', async () => {
        const res = await request(app)
            .delete(`/task/comment/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(201);
    });
});