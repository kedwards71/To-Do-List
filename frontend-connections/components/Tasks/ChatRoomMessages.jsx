import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Nav from 'react-bootstrap/Nav';
import { IoMdAdd } from "react-icons/io";
import { FaCommentAlt, FaEdit, FaMinus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ChatRoomMessagesTaskForm from "./ChatRoomMessagesTaskForm";

const ChatRoomMessages = ({
    showChatRoomMessages,
    setShowChatRoomMessages,
    selectedChatRoom,
    filteredMembers
}) => {
    const [message, setMessage] = useState('');
    const [categoryList, setCategoryList] = useState([]);
    const [category, setCategory] = useState('');
    const [task, setTask] = useState ({
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
    const [taskList, setTaskList] = useState([]);
    const [showTaskCreateForm,setShowTaskCreateForm] = useState(false);
    const [showTaskUpdateForm,setShowTaskUpdateForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState({
        'task_id' : 0,
        'task_title' : ''
    });

    const [taskStatus, setTaskStatus] = useState(['All', 'Not started', 'In progress', 'Completed']);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const navigate = useNavigate();

    const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;

    // Filter tasks by category and status
    const filteredTasks = 
    categoryList.includes(category) && category ? 
    ([...taskList].sort((a,b) => a.task_status.localeCompare(b.task_status))).reverse()
    .filter(t => (t.category === category) && ((selectedStatus === 'All' && t.task_status !=='Pending') || t.task_status === selectedStatus)) 
    : ([...taskList].sort((a,b) => a.category.localeCompare(b.category)))
    .filter(t => (selectedStatus === 'All' || t.task_status === selectedStatus));

    const getTasks = async() => {
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/room/${selectedChatRoom.room_id}`, requestOptions);
            if (!response.ok)
            {
                if(response.status === 403)
                    navigate('/');
                const data = await response.json();
                throw new Error(data.message || 'Failure to retrieve tasks');
            }
            const data = await response.json();
            setTaskList(data);
            console.log(data);
            setCategoryList([...new Set(data.map(task => task.category))]);

        } catch (error) {
            console.error('Error: ',error);
        }
    };

    const handleCategoryDelete = async() => {

    };

    const handleTaskDelete = async() => {

    };

    useEffect(() => {
        getTasks();
    },[showTaskUpdateForm,selectedChatRoom.room_id])

    return (
        <Modal
            show={showChatRoomMessages}
            onHide={() => setShowChatRoomMessages(false)}
            fullscreen={true}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <h1>{selectedChatRoom.room_name}  (Not fully implemented)</h1>
                    <h4>
                        Members:<br/>
                        {filteredMembers.map((f,index) => {
                            return(
                                <span>
                                    {f.member_id === selectedChatRoom.room_owner ? <strong>{f.member_display_name}</strong> : f.member_display_name}
                                    {(filteredMembers.length-1 !== index)&&', '}
                                </span>
                            )
                        })}
                    </h4>
                </Modal.Title>
            </Modal.Header>
            <Row className="chat-room-container">
                <Col md={6}>
                        <Row className="chat-room-categories">
                            <Card>
                                <Card.Header>
                                    <Card.Title> {`${selectedChatRoom.room_name}'s`} To-Do List </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Text>
                                        Create New Task
                                        <IoMdAdd className="btn-add-task" onClick={() => setShowTaskCreateForm(true)}/>
                                    </Card.Text>
                                    <ListGroup className='list-group-flush'>
                                        {categoryList.map((cat,index) => {
                                            return (
                                                <ListGroup.Item key={index} action active={category === cat} onClick={() => setCategory(cat)}>
                                                    <span>{cat ? cat : 'No Category'}</span>
                                                    <span>
                                                        <IoMdAdd className="btn-add-task" onClick={() => {
                                                            setTask({
                                                                ...task,
                                                                'category' : cat
                                                            });
                                                            setShowTaskCreateForm(true);
                                                        }}/>
                                                    </span>
                                                    <span><FaMinus className="btn-remove-task" onClick={() => alert('Feature not yet implemented')}/></span>
                                                </ListGroup.Item>
                                            )
                                        })}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Row>
                        <Row className="chat-room-tasks">
                            <Card>
                                <Card.Header>
                                    <Card.Title>
                                        {categoryList.includes(category) && category ? category : 'No selected Category'}
                                    </Card.Title>
                                </Card.Header>
                                <Card.Header>
                                    <Nav variant="pills" defaultActiveKey='#All'>
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
                                                return(
                                                    <ListGroup.Item key={`${tas.task_title}-${index}`}>
                                                        <span>
                                                            {tas.category!=''&&(!categoryList.includes(category) || 
                                                                !category)?
                                                                    <span><strong>{tas.category}</strong>: </span> : ''
                                                            }
                                                            {tas.task_status==='Completed' ? <s>{tas.task_title}</s> : tas.task_title}
                                                        </span>
                                                        <span><FaMinus className='btn-remove-task' onClick={() => alert('Not yet implemented')}/></span>
                                                        <span>
                                                            <FaEdit
                                                                className="btn-edit-task"
                                                                onClick={() => {
                                                                    setSelectedTask(tas);
                                                                    setShowTaskUpdateForm(true);
                                                                }}
                                                            />
                                                        </span>
                                                        <span>
                                                            <FaCommentAlt
                                                                className="btn-comment-task"
                                                                onClick={() => {
                                                                    setSelectedTask(tas);
                                                                    alert('Not yet implemented');
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
                        </Row>
                </Col>
                <Col
                    md={6}
                    className="messages-container"
                >
                    <Card style={{height:'100%'}}>
                        
                    </Card>
                    <Modal.Footer>
                        <div className="messages-footer">
                                <input 
                                    type="text"
                                    placeholder="Insert message here..." 
                                />
                                <Button variant='primary'>Send</Button>
                        </div>
                    </Modal.Footer>
                </Col>
            </Row>
            <ChatRoomMessagesTaskForm
                task={task}
                setTask={setTask}
                showTaskCreateForm={showTaskCreateForm}
                setShowTaskCreateForm={setShowTaskCreateForm}
                showTaskUpdateForm={showTaskUpdateForm}
                setShowTaskUpdateForm={setShowTaskUpdateForm}
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                selectedChatRoom={selectedChatRoom}
                categoryList={categoryList}
                setCategoryList={setCategoryList}
                taskList={taskList}
                setTaskList={setTaskList}
                filteredMembers={filteredMembers}
            />
        </Modal>
    )
};

export default ChatRoomMessages;