import React, { useEffect, useState } from "react";
import { MdRateReview } from 'react-icons/md';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { IoMdAdd } from "react-icons/io";
import { FaMinus } from "react-icons/fa";
import Button from "react-bootstrap/esm/Button";
import Nav from 'react-bootstrap/Nav'
import { FaCommentAlt } from "react-icons/fa";
import Comments from "./Comments.jsx";

const FriendTaskList = (({friend}) => {
    const [showTasks, setShowTasks] = useState(false);
    const [category, setCategory] = useState('');
    const [taskStatus, setTaskStatus] = useState(['All', 'Not started', 'In progress', 'Completed', 'Pending'])
    const [selectedTask, setSelectedTask] = useState({
        'task_title' : '',
        'task_description' : ''
    })
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [showTodoForm, setShowTodoForm] = useState(false)
    const [task, setTask] = useState({
        'task_title' : '',
        'task_description' : '',
        'created_by' : friend.user_id,
        'owner_id' : friend.friend_id,
        'category' : 'General',
        'task_status' : 'Pending',
        'task_id' : 0,
        'created_at' : new Date(),
        'updated_at' : new Date()
    });
    const [taskList, setTaskList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [showComments, setShowComments] = useState(false);

    // Filter tasks by category and status
    const filteredTasks =
        categoryList.includes(category) && category ?
            taskList.filter(t => (t.category === category) && (selectedStatus === 'All' || t.task_status === selectedStatus))
            : ([...taskList].sort( (a,b) => a.category.localeCompare(b.category)))
                .filter(t => (selectedStatus === 'All' || t.task_status === selectedStatus));

  const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;
      
    const handleTaskCreate = async (e) => {
        e.preventDefault();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(task)
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/task`, requestOptions);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error creating new task.')
            }
            const data = await response.json();
            setTaskList([...taskList, data]);
            if (!categoryList.includes(data.category))
            {
                setCategoryList([
                    ...categoryList,
                    data.category
                ])
            }
            setShowTodoForm(false);
            setTask({
                ...task,
                'task_description' : '',
                'task_title' : '',
                'category' : 'General'
            });
        } catch (error) {
            console.error('Error: ', error);
        }
    };

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
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const getTasks = async () => {
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };
        try{
            const response = await fetch(`${host || 'http://localhost:8123'}/friend/tasks/${friend.friend_id}`,requestOptions)
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Failure retrieving tasks.')
            }
            const data = await response.json();
            setTaskList(data);
            setCategoryList([...new Set(data.map(task => task.category))]);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    useEffect(() =>{
        getTasks();
    },[selectedStatus,showTodoForm])

    return (
        <span>
            <MdRateReview 
                className="btn-friend-tasks"
                onClick={() => setShowTasks(true)}
            />

      <Modal
        show={showTasks}
        onHide={() => setShowTasks(false)}
        fullscreen={true}
      >
        <Modal.Header closeButton>
          <Modal.Title id="example-custom-modal-styling-title">
            <span>{friend.display_name}'s To-Do List</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Row className="task-container">
                <Col md={6} className='todo-categories'> 
                    <Card>
                        <Card.Header>
                            <Card.Title>Categories</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Card.Text>
                                Create New Task
                                <IoMdAdd className='btn-add-task' onClick={() => setShowTodoForm(true)}/>
                            </Card.Text>
                            <ListGroup className='list-group-flush'>
                                {categoryList.map((cat, index) => {
                                  return(
                                    <ListGroup.Item key={index} action active={category === cat} onClick={() => setCategory(cat)}>
                                        <span>{cat ? cat : 'No Category'}</span>
                                        <span>
                                            <IoMdAdd className='btn-add-task' onClick={() => {
                                                setTask({
                                                    ...task,
                                                    'category' : cat
                                                })
                                                setShowTodoForm(true);
                                            }}/>
                                        </span>
                                    </ListGroup.Item>
                                  )  
                                })}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className='todo-tasks'>
                    <Card>
                        <Card.Header>
                            <Card.Title>{categoryList.includes(category) && category ? category : 'No selected Category' }</Card.Title>
                        </Card.Header>
                        <Card.Header>
                            <Nav variant='pills' defaultActiveKey='#All'>
                                {taskStatus.map((status,index) => {
                                    return (
                                        <Nav.Item key={index}>
                                            <Nav.Link
                                                href={`#${status}`}
                                                onClick={ (e) => {
                                                    e.preventDefault();
                                                    setSelectedStatus(status);
                                                }}
                                            >
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
                                        return(
                                            <ListGroup.Item key={`${tas.task_title}-${index}`}>
                                                <span>
                                                    {tas.category!=''&&(!categoryList.includes(category) || !category) ?
                                                        <span><strong>{tas.category}</strong>: </span> : ''
                                                    }
                                                    {tas.task_status==='Completed' ? <s>{tas.task_title}</s> : tas.task_title}
                                                </span>
                                                {selectedStatus==='Pending'&&<FaMinus className="btn-remove-task" onClick={() => handleTaskRemove(tas)}/>}
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
        </Modal.Body>
        <Modal
            show={showTodoForm}
            onHide={() => setShowTodoForm(false)}
            size='sm'
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title className="task-form-header">Add a task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form className="task-form-body" onSubmit={handleTaskCreate}>
                    <div className="form-group">
                        <label>Title</label><br/>
                        <input 
                            type='text'
                            placeholder="Enter Title of task here..."
                            value={task.task_title}
                            onChange={(e) => setTask({...task, 'task_title': e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label><br/>
                        <input
                            type='text'
                            placeholder="Enter Description of task here...(Optional)"
                            value={task.task_description}
                            onChange={(e) => setTask({...task, "task_description":e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label><br/>
                        <input
                            type='text'
                            placeholder="Enter Category of task here...(Optional)"
                            value={task.category}
                            onChange={(e) => setTask({...task, "category":e.target.value})}
                        />
                    </div>
                        <Button variant="primary" type="submit">
                            Create Task
                        </Button>
                </form>
            </Modal.Body>

        </Modal>
        <Comments selectedTask={selectedTask} showComments={showComments} setShowComments={setShowComments}/>
      </Modal>
        </span>
    )
})

export default FriendTaskList