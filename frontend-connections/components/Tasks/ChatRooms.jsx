import React, { useEffect, useState } from "react";
import Offcanvas from 'react-bootstrap/Offcanvas';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import { FaDoorOpen } from "react-icons/fa";

const ChatRooms = ({friends, selectedTab,setSelectedTab}) => {
    const [chatRoom, setChatRoom] = useState({
        'room_name' : '',
        'room_owner' : 0
    });
    const [chatRooms, setChatRooms] = useState([]);
    const [showChatForm, setShowChatForm] = useState(false);
    const [inviteList, setInviteList] = useState([]);
    const [friend, setFriend] = useState({
        'user_id' : 0,
        'friend_id' : 0,
        'display_name' : ''
    });
    const [tabOptions, setTabOptions] = useState(['Friends','Rooms'])
    const [selectedRoomStatus, setSelectedRoomStatus] = useState('Owned');
    const [roomStatus, setRoomStatus] = useState(['Owned', 'Joined','Invited']);
    return (
        <div>
            <Offcanvas.Header>
                <Offcanvas.Title>
                    <span>Chat Rooms</span>
                    <span><FaDoorOpen className="btn-room-create" onClick={() => setShowChatForm(true)}></FaDoorOpen></span>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Nav variant='tabs' defaultActiveKey='#Friends'>
                {tabOptions.map((tab) => {
                    return(
                        <Nav.Item key={tab}>
                            <Nav.Link
                                style={{
                                    background: selectedTab === tab ? 'grey' : '',
                                    color: selectedTab === tab ? 'white' : ''
                                }}
                                active={selectedTab === tab}
                                href={tab}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedTab(tab);
                                }}
                            >
                                {tab}
                            </Nav.Link>
                        </Nav.Item>
                    )
                })}
            </Nav>
            {selectedTab === 'Rooms' &&(
                <Offcanvas.Body>
                        <Nav variant="tabs" defaultActiveKey="#Owned">
                            {roomStatus.map((status) => {
                                return(
                                <Nav.Item key={status}>
                                    <Nav.Link
                                        style={{background: selectedRoomStatus === status ? 'blue' : 'white',
                                                color: selectedRoomStatus === status ? 'white' : ''
                                        }}
                                        active={selectedRoomStatus === status}
                                        href={status}
                                        onClick={ (e) => {
                                                e.preventDefault();
                                                setSelectedRoomStatus(status);
                                            } 
                                        }
                                    >
                                        {status}
                                    </Nav.Link>
                                </Nav.Item>
                                )
                            })}
                        </Nav>
                </Offcanvas.Body>
            )}
            <Modal
                show={showChatForm}
                onHide={() => setShowChatForm(false)}
                size='sm'
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="room-form-header">Create chat room</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="room-form-body" onSubmit={()=>alert('Create Room')}>
                        <div className="form-group">
                            <label>Room Name</label><br/>
                            <input
                                type="text"
                                placeholder="Enter Name of room here..."
                                value={chatRoom.room_name}
                                onChange={(e) => setChatRoom({...chatRoom, 'room_name': e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Choose from mutual friends:</label><br/>
                            <select value={friend?.friend_id || ''} onChange={(e)=>{
                                const selectedFriend = friends.find(f => f.friend_id === Number(e.target.value));
                                setFriend(selectedFriend)
                            }}>
                                <option value="">Friends</option>
                                {friends.map((f) => {
                                    return(
                                        <option key={f.friend_id} value={f.friend_id}>{f.display_name}</option>
                                    )
                                })};
                            </select>
                            <Button 
                                variant='success' 
                                className="btn-invite-add" 
                                onClick={() => {
                                    if(!friend.friend_id)
                                        return alert('You need to choose someone to add.')
                                    if(!inviteList.some(inv => inv.friend_id === friend.friend_id))
                                        setInviteList([...inviteList,friend]);
                                    else
                                        return alert('You\'ve already added this person');
                                }}
                            >
                                Add
                            </Button>
                        </div>
                        <div className="form-group">
                            <label>Add by Username:</label><br/>
                            <span>
                                <input type="text"
                                 onChange={(e) => {
                                    alert(e.target.value);
                                 }} 
                                />
                                <Button variant="success">Add</Button>
                            </span>
                        </div>
                        <div className="form-group">
                            <label>Invitation List:</label><br/>
                            {inviteList.length > 0 ? inviteList.map((invite,index) => {
                                return (
                                    <span>
                                        {invite.display_name}
                                        {index === inviteList.length-1? '' : ','}
                                    </span>
                                )
                            }) : 'No one invited'}
                        </div>
                        <Button variant='primary' type="submit">Create Room</Button>
                    </form>
                </Modal.Body>

            </Modal>
        </div>
    )
}

export default ChatRooms;