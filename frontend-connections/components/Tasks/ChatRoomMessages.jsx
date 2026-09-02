import { useState, useEffect, useRef } from 'react';
import Button from 'react-bootstrap/Button';
const ChatRoomMessages = ({
    selectedChatRoom,
    setMessageList
}) => {
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const isUnmountingRef = useRef(false);
    const connectionGenerationRef = useRef(0);

    const connectWebSocket = () => {
        if (isUnmountingRef.current) {
            return;
        }

        const connectionGeneration = connectionGenerationRef.current;
        const socketUrl = new URL(wsHost);
        socketUrl.pathname = `${socketUrl.pathname.replace(/\/$/, '')}/ws`;
        socketUrl.searchParams.set('token', sessionStorage.getItem('Bearer'));
        socketRef.current = new WebSocket(socketUrl);

        socketRef.current.onopen = () => {
            console.log('Connected');

            socketRef.current?.send(
                JSON.stringify({
                    type: 'join_room',
                    room_id: selectedChatRoom.room_id
                })
            );
        }

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            console.log(data);

            if (data.type === 'new_message' && data.message.room_id === selectedChatRoom.room_id){
                setMessageList(prev => [...prev, data.message]);
            }
        };


        socketRef.current.onclose = () => {
            if (!isUnmountingRef.current && connectionGeneration === connectionGenerationRef.current) {
                console.log('Reconnecting...');
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
            }
        };
    };


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

    const wsHost = import.meta.env.VITE_WS || `ws://localhost:8123`;

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
            if (socketRef.current?.readyState !== WebSocket.OPEN) {
                throw new Error('Message connection is not ready');
            }
            socketRef.current.send(
                JSON.stringify({
                    type: 'new_message',
                    room_id : selectedChatRoom.room_id,
                    message: newEntry
                })
            );
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
    },[selectedChatRoom.room_id])

    useEffect(() => {
        connectionGenerationRef.current += 1;
        isUnmountingRef.current = false;
        connectWebSocket();

        return () => {
            isUnmountingRef.current = true;
            connectionGenerationRef.current += 1;
            clearTimeout(reconnectTimeoutRef.current);

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ type: 'leave_room' }));
            }
            socketRef.current?.close();
            socketRef.current = null;
        };

    },[selectedChatRoom.room_id]);

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