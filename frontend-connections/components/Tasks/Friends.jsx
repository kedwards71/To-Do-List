import React, {useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Nav from 'react-bootstrap/Nav';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import { TiUserAdd } from "react-icons/ti";
import { HiUserRemove } from "react-icons/hi";
import { FaUserEdit } from "react-icons/fa";
import FriendTaskList from './FriendTaskList';



const Friends = () => {
    const [showFriends, setShowFriends] = useState(false);
    const [friendsList, setFriendsList] = useState([]);
    const [showFriendForm, setShowFriendForm] = useState(false);
    const [friendStatus, setFriendStatus] = useState(['Mutual' , 'Received', 'Sent']);
    const [selectedFriendStatus, setSelectedFriendStatus] = useState('Mutual');
    const [friend, setFriend] = useState({
        'username' : '',
        'user_id' : 0,
        'friend_id' : 0,
        'display_name' : ''
    });

    const [showUpdateDisplay, setShowUpdateDisplay] = useState(false);

    const host = import.meta.env.VITE_BACKEND 
    || 
        import.meta.env.VITE_HOST 
        || 
        `http://localhost:8123`;

    // Filter friends by status
    const filteredFriends =
        selectedFriendStatus === 'Mutual' ? friendsList.filter(f => ((f.user_accept === true) &&(f.friend_accept === true))) 
        : selectedFriendStatus === 'Sent' ? friendsList.filter(f => ((f.user_accept === true) && (f.friend_accept === false) ))
        : friendsList.filter(f => ((f.user_accept === false) && (f.friend_accept===true)));

    //Modal open and close controls
    const handleCloseFriends = () => setShowFriends(false);
    const handleShowFriends = () => setShowFriends(true);

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

    // Accept Friend Request
    const acceptFriendRequest = async (f) => {
        const payload = f;
        const requestOptions = {
            method : 'PUT',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(payload)
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/friend/accept`,requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error accepting friend request.')
            }
            const data = await response.json();
            let modifyFriend = friendsList.find(fri => f.friend_id === fri.friend_id );
            modifyFriend.user_accept = true;
            setFriend(f);



        } catch (error) {
            console.error('Error:', error)
        }

    }

    // Update Display Name
    const handleFriendUpdate = async () => {
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

    //Remove friend from list
    const handleFriendRemove = async (frie) => {
        const answer = prompt('Are you sure you would like to delete this friend?(Y to continue)');
        if (!answer || answer.toLowerCase() !== 'y')
            return;
        const requestOptions = {
            method : "DELETE",
            headers : {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/friend/${frie.friend_id}`, requestOptions)
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Failed to remove friend');
            }
            const data = await response.json();
            setFriendsList(friendsList.filter((f) => f != frie));

        } catch (error) {
            console.error('Error: ',error);
        }
    }

    //Fetch all friends for a user
    const getFriends = async () => {
        const requestOptions = {
            method : "GET",
            headers : {
                "Content-Type" : "application/json",
                "Authorization" : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/friend`, requestOptions)
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error retrieving friend list');
            }
            const data = await response.json();
            setFriendsList(data);
        } catch(error) {
            console.error('Error: ', error);
            setFriendsList([]);
        }
    }

    // Re-render friends everytime the list is updated
    useEffect(() => {
        getFriends();
    }, [showFriendForm, selectedFriendStatus])
  return (
    <div>
        <Button variant="primary" onClick={handleShowFriends}>
            Friends
        </Button>


        <Offcanvas show={showFriends} onHide={handleCloseFriends}>
            <Offcanvas.Header closeButton>
            <Offcanvas.Title>
                <span>Friends List</span>
                <span><TiUserAdd className="btn-friend-add" onClick={() => setShowFriendForm(true)}></TiUserAdd></span>

            </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Nav variant="pills" defaultActiveKey="#Mutual">
                    {friendStatus.map((status) => {
                        return(
                        <Nav.Item key={status}>
                            <Nav.Link
                                href={status}
                                onClick={ (e) => {
                                        e.preventDefault();
                                        setSelectedFriendStatus(status);
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
                {filteredFriends.length > 0 ? 
                    filteredFriends.map((f,index) => {
                        return(
                            <ListGroup.Item key={index}>
                                <span>{f.display_name}</span>
                                {
                                    (selectedFriendStatus === 'Received')
                                    &&
                                    <span><Button
                                            variant='success'
                                            className='accept-friend'
                                            onClick={() => {
                                            acceptFriendRequest(f)
                                            }}
                                            >
                                        Accept
                                        </Button>
                                    </span>
                                }
                                <span><HiUserRemove className="btn-friend-remove" onClick={() => handleFriendRemove(f)}></HiUserRemove></span>
                                <span>
                                    <FaUserEdit className="btn-friend-edit"
                                        onClick={() => {
                                            setFriend(f);
                                            setShowUpdateDisplay(true);
                                        }}
                                    />
                                </span>
                                {(selectedFriendStatus==='Mutual')&&<FriendTaskList friend={f}/>}
                            </ListGroup.Item>
                        )
                    })
                    :
                    'This category currently has no one in it. If you want to get started try sending a request.'
                }
                </ListGroup>
            </Offcanvas.Body>
        </Offcanvas>
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
    </div>
  )
}

export default Friends