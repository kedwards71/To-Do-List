import React from "react";
import Modal from "react-bootstrap/Modal";
import Button from 'react-bootstrap/Button';

const ChatRoomMessages = ({
    showChatRoomMessages,
    setShowChatRoomMessages,
    selectedChatRoom,
    filteredMembers
}) => {

    return (
        <Modal
            show={showChatRoomMessages}
            onHide={() => setShowChatRoomMessages(false)}
            fullscreen={true}
            className="messages-container"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <h1>{selectedChatRoom.room_name}</h1>
                    <h4>
                        Members:<br/>
                        {filteredMembers.map((f,index) => {
                            return(
                                <span>
                                    {f.member_display_name}
                                    {(filteredMembers.length-1 !== index)&&', '}
                                </span>
                            )
                        })}
                    </h4>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>

            </Modal.Body>
            <Modal.Footer>
                <div className="messages-footer">
                        <input 
                            type="text"
                            placeholder="Insert message here..." 
                        />
                        <Button variant='primary'>Send</Button>
                </div>
            </Modal.Footer>
        </Modal>
    )
};

export default ChatRoomMessages;