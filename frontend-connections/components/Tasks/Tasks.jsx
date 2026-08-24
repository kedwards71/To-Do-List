import React, { useState, useEffect } from 'react';
import './Tasks.css';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Nav from 'react-bootstrap/Nav';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import { IoMdAdd } from "react-icons/io";
import { FaMinus, FaEdit, FaCommentAlt } from "react-icons/fa";
import Friends from './Friends.jsx';
import Comments from './Comments.jsx';

const Tasks = () => {

    const [category, setCategory] = useState('');
    const [taskStatus, setTaskStatus] = useState(['All', 'Not started', 'In progress', 'Completed', 'Pending']);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [userInfo,setUserInfo] = useState({
        'username' : '',
        'user_id' : 0
    });
    const [showTodoForm, setShowTodoForm] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [task, setTask] = useState({
        "task_title" : "",
        "task_description" : "",
        "created_by" : 0,
        "owner_id" : 0,
        "category" : "General",
        "task_status" : "Not started",
        "task_id" : 0,
        "created_at" : new Date(),
        "updated_at" : new Date()
    });
    const [selectedTask, setSelectedTask] = useState({
        "task_title" : "",
        "task_description" : ""
    });
    const [taskList, setTaskList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [showComments, setShowComments] = useState(false);

    // Filter tasks by category and status
    const filteredTasks = 
    categoryList.includes(category) && category ? 
    taskList.filter(t => (t.category === category) && ((selectedStatus === 'All' && t.task_status !=='Pending') || t.task_status === selectedStatus)) 
    : ([...taskList].sort((a,b) => a.category.localeCompare(b.category)))
    .filter(t => (selectedStatus === 'All' || t.task_status === selectedStatus));
  
    const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;

    //Delete all tasks in a category
    const removeCategory =  async (cat) => {
        const requestOptions = {
            method : "DELETE",
            headers : {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/task?category=${cat}`,requestOptions);
            if (!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete category");
            }
            const data = await response.json();
            console.log(data);
            setCategoryList(categoryList.filter((c) => c !== cat));
            setTaskList(taskList.filter((t) => t.category != cat));
            setCategory('');
        } catch (error) {
            console.error("Error:", error);
        }
    }

    // Create a task
    const handleTaskCreate =  async (event) => {
        event.preventDefault();
        const user = JSON.parse(sessionStorage.getItem('token'));
        const payload = {
            "task_title" : task.task_title,
            "task_description" : task.task_description,
            "created_by" : user.id,
            "owner_id" : user.id,
            "category" : task.category,
            "task_status" : task.task_status,
            "task_id" : 0,
            "created_at" : new Date(),
            "updated_at" : new Date()
        }
        setTask({
            ...task,
            "created_by": userInfo.user_id,
            "owner_id" : userInfo.user_id
        });
        const requestOptions = {
            method: 'POST',
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem("Bearer")}`
            },
            body: JSON.stringify(payload)
        };
        try{
            const response = await fetch(`${host || 'http://localhost:8123'}/task`,requestOptions);
            if (!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || "Failed to create a new task");
            }
            const data = await response.json();
            console.log(data)
            setTaskList([...taskList, data]);
            if (!categoryList.includes(task.category))
                {
                    setCategoryList([
                        ...categoryList,
                        task.category
                    ])
                }
            setShowTodoForm(false);
            setTask({
                    ...task,
                    "task_description" : "",
                    "task_title" : "",
                    "category" : "General"
                });


        } catch (error) {
            console.error('Error:', error);
        }
    }

    const handleTaskAdd = async (tas) => {
        const requestOptions = {
            method:'PUT',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(tas)
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/task/accept/${tas.task_id}`, requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Failure acceptiing task');
            }
            const data = await response.json();
            let modify = taskList.find((t)=>t.task_id===tas.task_id);
            modify.acceptance = true;
            modify.task_status = 'Not Started';
            setSelectedStatus('Not Started');
        } catch (error) {
            console.error('Error: ', error)
        }
    }

    //Remove a task
    const handleTaskRemove = async (tas) => {
        const requestOptions = {
            method : 'DELETE',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/task/${tas.task_id}`, requestOptions);
            if (!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete task");
            }
            const data = await response.json();
            setTaskList(taskList.filter((t) => t!= tas));
            console.log(data);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Update a task
    const handleTaskEdit = async () => {
        const requestOptions = {
            method: 'PUT',
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem("Bearer")}`
            },
            body: JSON.stringify(selectedTask)
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/task/${selectedTask.task_id}`,requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Failure to Update task');
            }
            const data = await response.json();
            console.log(data);
            setSelectedTask({
                ...selectedTask,
                "updated_at" : data.updated_at
            })
            let modifyTask = taskList.find(t => t.task_id === selectedTask.task_id);
            console.log(modifyTask)
            modifyTask ={
                ...modifyTask,
                selectedTask
            }
            if (!categoryList.includes(selectedTask.category))
            {
                setCategoryList([
                    ...categoryList,
                    selectedTask.category
                ])
            }
            setSelectedTask('');
            setShowUpdateForm(false);

        } catch (error) {
            console.error("Error:",error);
        }
    }

    // Fetch all tasks
    const getTasks = async (user) => {
        const requestOptions = {
            method: 'GET',
            headers: {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem("Bearer")}`
            }
        };
        try{
            const response = await fetch(`${host || 'http://localhost:8123'}/task?user=${user.id}`, requestOptions);
            if (!response.ok)
            {
                const data = await response.json();
                throw new Error(data.message || 'Failure to retrieve tasks');
            }
            const data = await response.json();
            console.log(data);
            setTaskList(data);
            setCategoryList([...new Set(data.map(task => task.category))]);
        } catch (error) {
            console.error("Error:",error);
        }

    }


    //Populate userInfo with session decoded token information
    useEffect(() =>{
        const user = JSON.parse(sessionStorage.getItem('token'));
        if (user){
            setUserInfo({...userInfo,
                "username" : user.username,
                "user_id" : user.id
            });
            setTask({
                ...task,
                "created_by": user.id,
                "owner_id" : user.id,
            })
            getTasks(user);
        }

    },[showUpdateForm,selectedStatus])
    
    return (
        <>
            <div className="task-page">
                <Friends/>
                <Row className="task-container">
                    <Col md={6} className='todo-categories'>
                        <Card>
                            <Card.Header>
                                <Card.Title> {`${userInfo?.username}'s`} To-Do List</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    Create New Task
                                    <IoMdAdd className='btn-add-task' onClick={() => setShowTodoForm(true)}/>
                                </Card.Text>
                                <ListGroup className="list-group-flush">
                                    {categoryList.map((cat,index) =>{
                                        return (
                                            <ListGroup.Item key={index} action active={category === cat} onClick={() => setCategory(cat) }>
                                                <span>{cat ? cat : 'No Category'}</span>
                                                <span>
                                                    <IoMdAdd className='btn-add-task' onClick={() => {
                                                        setTask({
                                                            ...task,
                                                            "category" : cat
                                                        })
                                                        setShowTodoForm(true);
                                                    }}>
                                                    </IoMdAdd>
                                                </span>
                                                <span><FaMinus className='btn-remove-task' onClick={() => removeCategory(cat)}></FaMinus></span>
                                            </ListGroup.Item>
                                        )
                                    })}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} className='todo-tasks'>
                        <Card>
                            <Card.Header><Card.Title>{categoryList.includes(category) && category ? category : 'No selected Category' }</Card.Title></Card.Header>
                            <Card.Header>
                                <Nav variant="pills" defaultActiveKey="#All">
                                    {taskStatus.map((status,index) => {
                                        return (
                                            <Nav.Item key={index}>
                                                <Nav.Link 
                                                    href={`#${status}`} 
                                                    onClick={ (e) => {
                                                        e.preventDefault();
                                                        setSelectedStatus(status); 
                                                    }}>
                                                    {status}
                                                </Nav.Link>
                                            </Nav.Item>
                                        )
                                    })}

                                </Nav>
                            </Card.Header>
                            <Card.Body>
                                <ListGroup className="list-group-flush">
                                    {filteredTasks.length > 0 ? 
                                        filteredTasks.map((tas,index) => {
                                            return (
                                                <ListGroup.Item key={`${tas.task_title}-${index}`}>
                                                    <span>
                                                        {tas.category!=""&&(!categoryList.includes(category) || 
                                                            !category) ? 
                                                                <span><strong>{tas.category}</strong>: </span> : ''
                                                        } 
                                                        {tas.task_status==="Completed" ? <s>{tas.task_title}</s> : tas.task_title} 
                                                    </span>
                                                    <span><FaMinus className='btn-remove-task' onClick={() => handleTaskRemove(tas)}></FaMinus></span>
                                                    {tas.acceptance ?                      
                                                        <span>
                                                            <FaEdit 
                                                                className='btn-edit-task' 
                                                                onClick={() => {
                                                                    setSelectedTask(tas);
                                                                    setShowUpdateForm(true);
                                                                }}>
                                                            </FaEdit>
                                                        </span>
                                                        :
                                                        <Button variant='success' className='btn-task-add' onClick={() => handleTaskAdd(tas)}>Accept</Button>
                                                    }
                                                    <span>
                                                        <FaCommentAlt
                                                            className='btn-comment-task'
                                                            onClick={ () => {
                                                                setSelectedTask(tas);
                                                                setShowComments(true);
                                                            }}/>
                                                    </span>
                                                    {tas.task_description && (<span><br/><p><i> Description</i>: {tas.task_description}</p></span>)}
                                                </ListGroup.Item>
                                            )
                                        })
                                        : 
                                        "There are currently no tasks made or available for this category and status. Please create a new task or select a different category or status."
                                    }
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                <Modal 
                    show={showTodoForm} 
                    onHide={() => setShowTodoForm(false)}
                    size='sm'
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title className="task-form-header">Add a task</Modal.Title>
                    </Modal.Header>
                    <Modal.Body >
                        <form className="task-form-body" onSubmit={handleTaskCreate}>
                            <div className="form-group">
                                <label>Title</label><br/>
                                <input type="text" 
                                    placeholder="Enter Title of task here..." 
                                    value={task.task_title} 
                                    onChange={(e) => setTask({...task, "task_title": e.target.value})} 
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label><br/>
                                <input type="text" 
                                    placeholder="Enter Description of task here...(Optional)" 
                                    value={task.task_description} 
                                    onChange={(e) => setTask({...task, "task_description": e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label><br/>
                                <input type="text" 
                                    placeholder="Enter Category of task here...(Optional)"
                                    value={task.category}
                                    onChange={(e) => setTask({...task, "category": e.target.value})} 
                                />
                            </div>
                            <Button variant="primary" type="submit">
                                Create Task
                            </Button>
                        </form>
                    </Modal.Body>
                </Modal>
                <Modal 
                    show={showUpdateForm}
                    onHide={() => setShowUpdateForm(false)}
                    size='md'
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Update Task</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form className="task-form-body" onSubmit={handleTaskEdit}>
                            <div className="form-group">
                                <label>Title</label><br/>
                                <input type="text"
                                    placeholder="Enter Title of task here..."
                                    value={selectedTask.task_title}
                                    onChange={(e) => setSelectedTask({...selectedTask, "task_title": e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label><br/>
                                <input type="text"
                                    placeholder="Enter Description of task here...(Optional)"
                                    value={selectedTask.task_description}
                                    onChange={(e) => setSelectedTask({...selectedTask, "task_description": e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label><br/>
                                <input type="text"
                                    placeholder="Enter Category of task here...(Optional)"
                                    value={selectedTask.category}
                                    onChange={(e) => setSelectedTask({...selectedTask, "category": e.target.value})}
                                />
                            </div>
                            <div className="form-group" style={{display:'flex', flexDirection:'column'}}>
                                <label>What's the status?</label>
                                <select id="status-select" value={selectedTask.task_status|| "Not started"} onChange={(e) => setSelectedTask({...selectedTask, "task_status": e.target.value})}>
                                    <option value='Not started'>Not started</option>
                                    <option value='In progress'>In progress</option>
                                    <option value='Completed'>Completed</option>
                                </select>
                            </div>
                            <p><strong>Started</strong>:{new Date(selectedTask.created_at).toLocaleString()}</p>
                            <p><strong>Last Modified</strong>:{new Date(selectedTask.updated_at).toLocaleString()}</p>
                            <div className="form-group">
                                <Button variant="primary" type="submit">
                                    Update Task
                                </Button>
                            </div>
                        </form>
                    </Modal.Body>
                </Modal>
                <Comments selectedTask={selectedTask} showComments={showComments} setShowComments={setShowComments}/>

            </div>
        </>
    )
}

export default Tasks;