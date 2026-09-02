import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
const ChatRoomMessages = ({
    selectedChatRoom,
    messageList,
    setMessageList
}) => {
    const userInfo = JSON.parse(sessionStorage.getItem('token'));
    const [message, setMessage] = useState({
        'message_id' : 0,
        'room_id' : selectedChatRoom.room_id,
        'messenger_id' : userInfo.id,
        'message_content' : '',
        'sent_at' : new Date()

    });

    const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;

    const handleMessageSend = async () => {
        const requestOptions = {
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body : JSON.stringify(message)
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/message`, requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error sending message');
            }
            const data = await response.json();
            const newEntry = {
                ...data.message,
                'member_display_name' : data.name
            };
            setMessageList([...messageList, newEntry]);
            setMessage({
                'message_id' : 0,
                'room_id' : selectedChatRoom.room_id,
                'messenger_id' : userInfo.id,
                'message_content' : '',
                'sent_at' : new Date()
            });
        } catch (error) {
            console.error('Error: ', error);
        }
    };

    const getMessages = async () => {
        const requestOptions = {
            method : 'GET',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        };

        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/message/${selectedChatRoom.room_id}`, requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error fetching messages');
            }
            const data = await response.json();
            setMessageList(data);
        } catch (error) {
            console.error('Error: ', error);
        }
    };

    useEffect(() => {
        getMessages();
    },[selectedChatRoom.room_id, messageList.length])

    return (
        <>
            <div className="messages-footer">
                    <input 
                        type="text"
                        placeholder="Insert message here..."
                        value={message.message_content}
                        onChange={(e) => setMessage({...message, 'message_content' : e.target.value})} 
                    />
                    <Button variant='primary' onClick={handleMessageSend}>Send</Button>
            </div>
        </>
    );
};

export default ChatRoomMessages;