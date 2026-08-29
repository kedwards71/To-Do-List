import React from "react";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const FriendForms = ({
        showFriendForm,
        setShowFriendForm,
        friend, 
        setFriend, 
        showUpdateDisplay, 
        setShowUpdateDisplay,
        friendsList
    }) => {

    const host = import.meta.env.VITE_BACKEND 
    || 
        import.meta.env.VITE_HOST 
        || 
        `http://localhost:8123`;
        
    // Submit friend request
    const sendFriendRequest = async (e) => {
        e.preventDefault();
        const payload = {
            "user_id" : friend.user_id,
            "friend_id" : friend.friend_id,
            "display_name" : friend.display_name ? friend.display_name : friend.username,
            "username" : friend.username,
            "user_accept" : true,
            "friend_accept" : false
        };

        setFriend({...friend,
            'username' : '',
            'user_id' : 0,
            'friend_id' : 0,
            'display_name' : ''
        });
        const requestOptions = {
            method : "POST",
            headers : {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(payload)
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/friend`,requestOptions);
            if (!response.ok){
                const data = await response.json();
                if(response.status === 409){
                    alert('You already sent this person a request');
                }
                throw new Error(data.message || 'Failure to send friend request');
            }
            const data = await response.json();
            setShowFriendForm(false);

        } catch (error) {
            console.error('Error:',error);
        }


    }

    // Update Display Name
    const handleFriendUpdate = async (e) => {
        e.preventDefault();
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(friend)
        };

        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/friend/${friend.friend_id}`, requestOptions)
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error updating display name');
            }
            const data = await response.json();
            let modifyFriend = friendsList.find(f => f.friend_id === friend.friend_id);
            modifyFriend.display_name = data.display_name;
            setShowUpdateDisplay(false);
        } catch (error) {
            console.error('Error:',error);
        }

    }

    return (
        <>
                <Modal
                    show={showFriendForm}
                    onHide={() => setShowFriendForm(false)}
                    size = 'sm'
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Add a Friend</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form className="friend-form-body" onSubmit={sendFriendRequest}>
                            <div className="form-group">
                                <label>Username</label><br/>
                                <input
                                    type="text"
                                    placeholder="Enter your friend's username"
                                    value={friend.username}
                                    onChange={(e) => setFriend({...friend, "username" : e.target.value})}
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <label>Display Name</label><br/>
                                <input
                                    type="text"
                                    placeholder={`${friend.username}` || 'Desired display name'}
                                    value={friend.display_name}
                                    onChange={(e) => setFriend({...friend, "display_name" : e.target.value})}
                                />
                            </div>
                            <Button variant='primary' type='submit'>
                                Send Request
                            </Button>
                        </form>
                    </Modal.Body>
                </Modal>
                <Modal
                    show={showUpdateDisplay}
                    onHide={() => setShowUpdateDisplay(false)}
                    size='sm'
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Change Display Name</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form className="friend-form-body" onSubmit={handleFriendUpdate}>
                            <label>Display Name</label>
                            <input
                                type='text'
                                value={friend.display_name}
                                onChange={(e) => setFriend({
                                    ...friend,
                                    "display_name" : e.target.value
                                })}
                            />
                            <Button variant='primary' type='submit'>Submit</Button>
                        </form>
                    </Modal.Body>
                </Modal>
        </>
    )
}

export default FriendForms;