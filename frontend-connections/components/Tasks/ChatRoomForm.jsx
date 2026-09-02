import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const ChatRoomForm = ({
    showChatForm,
    setShowChatForm, 
    chatRooms, 
    setChatRooms,
    roomMembers,
    setRoomMembers,
    friends
    }) => {
    const [chatRoom, setChatRoom] = useState({
        'room_name' : '',
        'room_owner' : 0
    });
    const [inviteList, setInviteList] = useState([]);
    const [friend, setFriend] = useState({
        'user_id' : 0,
        'friend_id' : 0,
        'display_name' : ''
    });
    const [friendUsername, setFriendUsername] = useState('');

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
                if(response.status === 403){
                    navigate('/');
                    return;
                }
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
                setInviteList([]);
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
  return (
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
  )
}

export default ChatRoomForm;