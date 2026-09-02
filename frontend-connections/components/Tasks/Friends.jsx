import React, {useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Nav from 'react-bootstrap/Nav';
import ListGroup from 'react-bootstrap/ListGroup';
import { TiUserAdd } from "react-icons/ti";
import { HiUserRemove } from "react-icons/hi";
import { FaUserEdit } from "react-icons/fa";
import FriendTaskList from './FriendTaskList';
import FriendForms from './FriendForms';
import { useNavigate } from 'react-router-dom';
import ChatRooms from './ChatRooms';



const Friends = () => {
    const [showFriends, setShowFriends] = useState(false);
    const [friendsList, setFriendsList] = useState([]);
    const [showFriendForm, setShowFriendForm] = useState(false);
    const [friendStatus, setFriendStatus] = useState(['Mutual' , 'Received', 'Sent']);
    const [selectedFriendStatus, setSelectedFriendStatus] = useState('Mutual');
    const [selectedTab, setSelectedTab] = useState('Friends');
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
    const navigate = useNavigate();

    // Filter friends by status
    const filteredFriends =
        selectedFriendStatus === 'Mutual' ? friendsList.filter(f => ((f.user_accept === true) &&(f.friend_accept === true))) 
        : selectedFriendStatus === 'Sent' ? friendsList.filter(f => ((f.user_accept === true) && (f.friend_accept === false) ))
        : friendsList.filter(f => ((f.user_accept === false) && (f.friend_accept===true)));

    const mutualFriends =
        friendsList.filter(f => ((f.user_accept === true) && (f.friend_accept === true)));
    //Modal open and close controls
    const handleCloseFriends = () => setShowFriends(false);
    const handleShowFriends = () => setShowFriends(true);



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
                if(response.status === 403){
                    navigate('/');
                    return;
                }
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

    const handleLogOut = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('Bearer');
        navigate('/');
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
                if(response.status === 403){
                    navigate('/');
                    return;
                }
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
                if(response.status === 403){
                    navigate('/');
                    return;
                }
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
        <Button variant='secondary' onClick={handleLogOut}>
            Log out
        </Button>


        <Offcanvas show={showFriends} onHide={handleCloseFriends}>
            <Offcanvas.Header closeButton>
            <Offcanvas.Title>
                <span>Friends List</span>
                <span><TiUserAdd className="btn-friend-add" onClick={() => setShowFriendForm(true)}></TiUserAdd></span>
            </Offcanvas.Title>
            </Offcanvas.Header>
            <ChatRooms friends={mutualFriends} selectedTab={selectedTab} setSelectedTab={setSelectedTab}/>
            {selectedTab === 'Friends' &&(
                <Offcanvas.Body>
                    
                    <Nav variant="tabs" defaultActiveKey="#Mutual">
                        {friendStatus.map((status) => {
                            return(
                            <Nav.Item key={status}>
                                <Nav.Link
                                    style={{background: selectedFriendStatus === status ? 'blue' : 'white',
                                            color: selectedFriendStatus === status ? 'white' : ''
                                    }}
                                    active={selectedFriendStatus === status}
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
            )}
        </Offcanvas>
        <FriendForms 
            showFriendForm={showFriendForm} 
            setShowFriendForm={setShowFriendForm}
            friend={friend}
            setFriend={setFriend}
            showUpdateDisplay={showUpdateDisplay}
            setShowUpdateDisplay={setShowUpdateDisplay}
            friendsList={friendsList}
        />
    </div>
  )
}

export default Friends