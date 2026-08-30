import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Nav from 'react-bootstrap/Nav';
import { IoMdAdd } from "react-icons/io";
import { FaMinus } from "react-icons/fa";

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
        'room_id' : selectedChatRoom.room_id,
        'category' : ''
    });
    const [taskStatus, setTaskStatus] = useState(['All', 'Not started', 'In progress', 'Completed']);
    const [selectedStatus, setSelectedStatus] = useState('All');
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
                                        <IoMdAdd className="btn-add-task" onClick={() => alert('Feature not yet implemented')}/>
                                    </Card.Text>
                                    <ListGroup className='list-group-flush'>
                                        {categoryList.map((cat,index) => {
                                            return (
                                                <ListGroup.Item key={index} action active={category === cat} onClick={() => setCategory(cat)}>
                                                    <span>{cat ? cat : 'No Category'}</span>
                                                    <span>
                                                        <IoMdAdd className="btn-add-task" onClick={() => {

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
        </Modal>
    )
};

export default ChatRoomMessages;