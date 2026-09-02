import React, { useState } from 'react'
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
const ChatRoomInvite = ({
    selectedChatRoom,
    showChatInviteForm,
    setShowChatInviteForm
}) => {
    const [inviteList, setInviteList] = useState([]);
    const [friendUsername, setFriendUsername] = useState('');
    const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;

    const sendRoomInvites = (e,room) => {
        e.preventDefault();
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
                if(response.status === 409)
                    alert(`The user '${invite.display_name}' has already received an invite!`);
                    const data = await response.json();
                    throw new Error(data.message || 'Error inviting member.');
                }
                const data = await response.json();
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
        show={showChatInviteForm}
        onHide={() => setShowChatInviteForm(false)}
        size='sm'
        centered
    >
        <Modal.Header closeButton>
            <Modal.Title className="room-form-header">Invite a new member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <form className="room-form-body" onSubmit={(e) => sendRoomInvites(e,selectedChatRoom)}>
                <div className="form-group">
                    <label>{selectedChatRoom.room_name}</label><br/>
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
                <Button variant='primary' type="submit">Send Invites</Button>
            </form>
        </Modal.Body>
    </Modal>  
    )
}

export default ChatRoomInvite