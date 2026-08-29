import React, { useEffect, useState } from "react";
import Offcanvas from 'react-bootstrap/Offcanvas';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import ListGroup from 'react-bootstrap/ListGroup';
import { FaDoorOpen } from "react-icons/fa";
import { GiExitDoor } from 'react-icons/gi';
import { FaTrash } from "react-icons/fa";

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
    const [friendUsername, setFriendUsername] = useState('');
    const [roomMembers, setRoomMembers] = useState([]);

    const userInfo = JSON.parse(sessionStorage.getItem('token'));
    const roomsWithMe = roomMembers.filter(r => (r.member_id === userInfo.id));
    const filterRooms =
        selectedRoomStatus === 'Owned' ? chatRooms.filter(c => ((c.room_owner === userInfo.id)))
        : selectedRoomStatus === 'Joined' ? chatRooms.filter(c => ((roomsWithMe.some(r => (r.room_id === c.room_id) 
            && r.member_accept === true && c.room_owner !== r.member_id))))
        : chatRooms.filter(c => ((roomsWithMe.find(r => (r.room_id === c.room_id)
            && r.member_accept === false))));

    const host = import.meta.env.VITE_BACKEND
    || 
        import.meta.env.VITE_HOST 
        || 
        `http://localhost:8123`;

    const handleRoomCreate = async (e) => {
        e.preventDefault();
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(chatRoom)
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/chat`,requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error creating room.');
            }
            const data = await response.json();
            const user = JSON.parse(sessionStorage.getItem('token'));
            const newRoomMember = {
                "room_id" : data.room_id,
                "member_id" : data.room_owner,
                "member_display_name" : user.username,
                "member_accept" : true
            };
            setRoomMembers([...roomMembers,newRoomMember]);
            setChatRooms([...chatRooms,data]);
            setChatRoom({
                'room_name' : '',
                'room_owner' : 0
            });
            sendRoomInvites(data);
            setShowChatForm(false);
        } catch (error) {
            console.error('Error: ', error);
        }
    };

    const sendRoomInvites = (room) => {
        if(inviteList.length === 0)
            return;
        inviteList.forEach( async (invite) => {
            const requestOptions = {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/json',
                    'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
                },
                body : JSON.stringify(invite)
            };
            try {
                const response = await fetch(`${host || 'http://localhost:8123'}/chat/${room.room_id}`,requestOptions);
                if (!response.ok){
                    const data = await response.json();
                    throw new Error(data.message || 'Error inviting member.');
                }
                const data = await response.json();
                setRoomMembers(prev => [...prev,data]);
            } catch (error) {
                console.error('Error: ', error);
            }
        });
    };

    const handleAddUsername = async () => {
        const requestOptions = {
            method : 'GET',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/users/${friendUsername}`,requestOptions);
            if (!response.ok){
                if (response.status === 404)
                    alert('That person does not exist.');
                const data = await response.json();
                throw new Error(data.message || 'Error accepting friend request.')
            }
            const data = await response.json();
            const user = JSON.parse(sessionStorage.getItem('token'));
            const newInvite = {
                'user_id' : user.id,
                'friend_id' : data.user_id,
                'display_name' : data.username
            };
            if(!inviteList.some(inv => inv.friend_id === newInvite.friend_id))
                setInviteList([...inviteList,newInvite]);
            else
                return alert('You\'ve already added this person to the list.');
        } catch (error) {
            console.error('Error: ', error);
        }

    };

    const getRooms = async () => {
        const requestOptions = {
            method : 'GET',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/chat`, requestOptions)
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error fetching chat rooms');
            }
            const data = await response.json();
            setChatRooms(data.rooms);
            setRoomMembers(data.members);
        } catch (error) {
            console.error('Error: ',error);
        }
    };

    useEffect(() => {
        getRooms();
    }, [])

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
                        <ListGroup>
                            {filterRooms.length > 0 ? 
                                filterRooms.map((f,index) => {
                                    return(
                                        <ListGroup.Item key={index}>
                                            <span>{f.room_name}</span>
                                            {selectedRoomStatus === 'Owned' && (
                                                <span><FaTrash className="btn-room-delete" /></span>
                                            )}
                                            <span><GiExitDoor className="btn-room-leave"/></span>
                                            {selectedRoomStatus === 'Invited' && (
                                                <Button variant="success" className="btn-room-add">Accept</Button>
                                            )}
                                        </ListGroup.Item>
                                    )
                                })
                                :
                                'There are no rooms to see in this category.'
                            }
                        </ListGroup>
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
                    <form className="room-form-body" onSubmit={handleRoomCreate}>
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
                                    setFriendUsername(e.target.value);
                                 }} 
                                />
                                <Button variant="success" onClick={handleAddUsername}>Add</Button>
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