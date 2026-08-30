import React, { useEffect, useState } from "react";
import Offcanvas from 'react-bootstrap/Offcanvas';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import ListGroup from 'react-bootstrap/ListGroup';
import { FaDoorOpen } from "react-icons/fa";
import { GiExitDoor } from 'react-icons/gi';
import { FaTrash } from "react-icons/fa";
import ChatRoomForm from "./ChatRoomForm";

const ChatRooms = ({friends, selectedTab,setSelectedTab}) => {

    const [chatRooms, setChatRooms] = useState([]);
    const [showChatForm, setShowChatForm] = useState(false);

    const [tabOptions, setTabOptions] = useState(['Friends','Rooms'])
    const [selectedRoomStatus, setSelectedRoomStatus] = useState('Owned');
    const [roomStatus, setRoomStatus] = useState(['Owned', 'Joined','Invited']);
    const [roomMembers, setRoomMembers] = useState([]);

    const userInfo = JSON.parse(sessionStorage.getItem('token'));
    const roomsWithMe = roomMembers.filter(r => (r.member_id === userInfo.id));
    const filterRooms =
        selectedRoomStatus === 'Owned' ? chatRooms.filter(c => ((c.room_owner === userInfo.id)))
        : selectedRoomStatus === 'Joined' ? chatRooms.filter(c => ((roomsWithMe.some(r => (r.room_id === c.room_id) 
            && r.member_accept === true && c.room_owner !== r.member_id))))
        : chatRooms.filter(c => ((roomsWithMe.some(r => (r.room_id === c.room_id)
            && r.member_accept === false))));

    const host = import.meta.env.VITE_BACKEND
    || 
        import.meta.env.VITE_HOST 
        || 
        `http://localhost:8123`;


    const handleRoomAccept = async (room) => {
        const requestOptions = {
            method : 'PUT',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/chat/${room.room_id}/accept`,requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error accepting invitation');
            }
            const data = await response.json();
            let modifyMember = roomMembers.find(r => ((r.room_id === room.room_id) && (userInfo.id === r.member_id)));
            modifyMember = data;
            
        } catch (error) {
            console.error('Error: ', error);
        }
    }

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

    const handleRoomDelete = async (room) => {
        const requestOptions = {
            method : 'DELETE',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/chat/${room.room_id}`,requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error Deleting room');
            }
            const data = await response.json();
            setChatRooms(chatRooms.filter(c => c !== room ));
            setRoomMembers(roomMembers.filter(r => r.room_id !== room.room_id));
            console.log(data);
        } catch (error) {
            console.error('Error: ', error);
        }
    };

    const handleRoomLeave = async (room) => {
        const requestOptions = {
            method : 'DELETE',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/chat/${room.room_id}/leave`,requestOptions);
            if(!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error leaving the room.')
            }
            const data = await response.json();
            setChatRooms(chatRooms.filter(c => c.room_id !== room.room_id));
            setRoomMembers(roomMembers.filter(r => r.room_id !== room.room_id));
            console.log(data);

        } catch (error) {
            console.error('Error: ', error);
        }
    }

    useEffect(() => {
        getRooms();
    }, [selectedRoomStatus])

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
                                                <span><FaTrash className="btn-room-delete" onClick={() => handleRoomDelete(f)} /></span>
                                            )}
                                            <span><GiExitDoor className="btn-room-leave" onClick={() => handleRoomLeave(f)}/></span>
                                            {selectedRoomStatus === 'Invited' && (
                                                <Button variant="success" className="btn-room-add" onClick={() => handleRoomAccept(f)}>Accept</Button>
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
            <ChatRoomForm
                showChatForm={showChatForm}
                setShowChatForm={setShowChatForm}
                chatRooms={chatRooms}
                setChatRooms={setChatRooms}
                roomMembers={roomMembers}
                setRoomMembers={setRoomMembers}
                friends={friends}
            />

        </div>
    )
}

export default ChatRooms;