import request from 'supertest';
import app from '../index.js';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

describe('GET /task (protected)', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/login')
            .send({username: 'khae', password: 'test'});
        token = res.body.token;
    });

    it('should succeed with a valid token', async () => {
        const res = await request(app)
            .get('/task')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fail with no token', async () => {
        const res = await request(app)
            .get('/task');
        expect(res.statusCode).toBe(401);
    });

    it('should fail with an invalid token', async () =>{
        const res = await request(app)
            .get('/task')
            .set('Authorization', 'Bearer forgedToken');
        expect(res.statusCode).toBe(403);
    })

});

describe('[POST, PUT, DELETE] /task (protected)', () => {
    let token;
    let decoded;
    let targetId;

    beforeAll(async () =>{
        const res = await request(app)
            .post('/login')
            .send({username:'khae',password:'test'});
        token = res.body.token;
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    });
    //POST
    it('should succeed with a valid token and return a 201 code ', async () =>{
        const res = await request(app)
            .post('/task')
            .set('Authorization', `Bearer ${token}`)
            .send({task_title:'New Task', 
                    task_description: 'This is a descriptive task',
                    created_by : decoded.id,
                    owner_id : decoded.id
                });
        expect(res.statusCode).toBe(201);
        expect(res.body.task_title).toBe('New Task');
        targetId = res.body.task_id;
    });
    //PUT
    it('should change the name and return a status code of 201', async () => {
        const res = await request(app)
            .put(`/task/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ task_title: 'Changed Task',
                    task_description : 'Same old same',
                    category : 'default',
                    task_status:'In progress'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.task_title).not.toBe('New Task');
    });

    //DELETE
    it('should delete the newly created task with a valid token and return 201 code', async () =>{
        const res = await request(app)
            .delete(`/task/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(201);
    });
    //DELETE
    it('should fail to delete because the value no longer exists and return a 404 code', async () => {
        const res = await request(app)
            .delete(`/task/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(404);   
    });
    
    //PUT
    it('should  fail because the task no longer exists and return 404', async () => {
        const res = await request(app)
            .put(`/task/${targetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ task_title: 'Changed Task',
                    task_description : 'Same old same',
                    category : 'default',
                    task_status:'In progress'
            });
        expect(res.statusCode).toBe(404);
    });
    
    //POST
    it('should fail because there is no auth token', async () => {
        const res = await request(app)
            .post('/task')
            .send({task_title:'New Task', 
                    task_description: 'This is a descriptive task',
                    created_by : decoded.id,
                    owner_id : decoded.id
                });
        expect(res.statusCode).toBe(401);
    });
});