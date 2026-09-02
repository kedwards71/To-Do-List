import React, { useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';

const ChatRoomMessagesTaskForm = ({
    task,
    setTask,
    showTaskCreateForm,
    setShowTaskCreateForm,
    showTaskUpdateForm,
    setShowTaskUpdateForm,
    selectedTask,
    setSelectedTask,
    selectedChatRoom,
    categoryList,
    setCategoryList,
    taskList,
    setTaskList,
    filteredMembers
}) => {
    const navigate = useNavigate();
    const creator = filteredMembers.find(f => f.member_id === selectedTask.created_by);
    const updator = filteredMembers.find(f => f.member_id === selectedTask.updated_by);
    const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;

    const handleTaskCreate = async (e) => {
        e.preventDefault();
        const userInfo = JSON.parse(sessionStorage.getItem('token'));
        const payload = {
            ...task,
            'room_id' : selectedChatRoom.room_id,
            'created_by': userInfo.id,
            'updated_by' : userInfo.id,
            'created_at' : new Date(),
            'updated_at' : new Date()
        };
        const requestOptions ={
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(payload)
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/room/task`,requestOptions);
            if (!response.ok){
                if(response.status === 403){
                    navigate('/');
                    return;
                }
                const data = await response.json();
                throw new Error(data.message || 'Error creating task.');
            }
            const data = await response.json();
            setTask({
                'task_id' : 0,
                'room_id' : selectedChatRoom.room_id,
                'task_title' : '',
                'task_description' : '',
                'task_status' : 'Not started',
                'created_at' : new Date(),
                'updated_at' : new Date(),
                'created_by' : 0,
                'updated_by' : 0,
                'category' : 'General'
            });
            setTaskList([...taskList, data]);
            if(!categoryList.includes(data.category)){
                setCategoryList([...categoryList,data.category]);
            }
            setShowTaskCreateForm(false);
        } catch (error) {
            console.error('Error: ',error);
        }
    };

    const handleTaskUpdate = async (e) => {
        e.preventDefault();
        const userInfo = JSON.parse(sessionStorage.getItem('token'));
        const payload = {
            ...selectedTask,
            'updated_by' : userInfo.id
        };
        const requestOptions = {
            method : 'PUT',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(payload)
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/room/task/${selectedTask.task_id}`,requestOptions)
            if (!response.ok){
                if(response.status === 403){
                    navigate('/');
                    return;
                }
                const data = await response.json();
                throw new Error(data.message || 'Error updating task')
            }
            const data = await response.json();
            console.log(taskList);
            let modifyTask = taskList.find(t => t.task_id === data.task_id);
            modifyTask = {
                ...modifyTask,
                data
            };
            console.log(modifyTask);
            console.log(taskList);
            if (!categoryList.includes(data.category)){
                setCategoryList([
                    ...categoryList,
                    data.category
                ]);
            }
            setSelectedTask({});
            setShowTaskUpdateForm(false);
            
        } catch (error) {
            console.error('Error: ', error);
        }
    }

  return (
    <>
        <Modal
            show={showTaskCreateForm}
            onHide={() => setShowTaskCreateForm(false)}
            size='sm'
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title className='task-form-header'>Add a task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form className="task-form-body" onSubmit={handleTaskCreate}>
                    <div className="form-group">
                        <label>Title</label><br/>
                        <input
                            type='text'
                            placeholder='Enter Title of task here...'
                            value={task.task_title}
                            onChange={(e) => setTask({...task, 'task_title': e.target.value})}
                            required
                        />
                    </div>
                    <div className='form-group'>
                        <label>Description</label><br/>
                        <input
                            type='text'
                            placeholder='Enter Description of task here...(Optional)'
                            value={task.task_description}
                            onChange={(e) => setTask({...task, 'task_description': e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label><br/>
                        <input
                            type='text'
                            placeholder='Enter Category of task here...(Optional)'
                            value={task.category}
                            onChange={(e) => setTask({...task, 'category': e.target.value})}
                        />
                    </div>
                    <Button variant='primary' type='submit'>
                        Create Task
                    </Button>
                </form>
            </Modal.Body>
        </Modal>
        <Modal
            show={showTaskUpdateForm}
            onHide={() => setShowTaskUpdateForm(false)}
            size='md'
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Update Task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form className="task-form-body" onSubmit={handleTaskUpdate}>
                    <div className="form-group">
                        <label>Title</label><br/>
                        <input
                            type='text'
                            placeholder='Enter Title of task here...'
                            value={selectedTask.task_title}
                            onChange={(e) => setSelectedTask({...selectedTask, 'task_title': e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label><br/>
                        <input
                            type='text'
                            placeholder='Enter Description of task here...(Optional)'
                            value={selectedTask.task_description}
                            onChange={(e) => setSelectedTask({...selectedTask, 'task_description' : e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label><br/>
                        <input
                            type='text'
                            placeholder='Enter Category of task here...(Optional)'
                            value={selectedTask.category}
                            onChange={(e) => setSelectedTask({...selectedTask, 'category': e.target.value})}
                        />
                    </div>
                    <div className="form-group" style={{display:'flex', flexDirection:'column'}}>
                        <label>What's the status?</label>
                        <select id='status-select' value={selectedTask.task_status || 'Not started'} onChange={(e) => setSelectedTask({...selectedTask, 'task_status': e.target.value})}>
                            <option value='Not started'>Not started</option>
                            <option value='In progress'>In progress</option>
                            <option value='Completed'>Completed</option>
                        </select>
                    </div>
                    <p><strong>Created by</strong>:{creator?.member_display_name}</p>
                    <p><strong>Started</strong>:{new Date(selectedTask.created_at).toLocaleString()}</p>
                    <p><strong>Updated by</strong>:{updator?.member_display_name}</p>
                    <p><strong>Last Modified</strong>:{new Date(selectedTask.updated_at).toLocaleString()}</p>
                    <div className="form-group">
                        <Button variant='primary' type='submit'>
                            Update Task
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    </>
  )
}

export default ChatRoomMessagesTaskForm