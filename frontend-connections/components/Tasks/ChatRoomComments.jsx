import React , {useState, useEffect} from 'react';
import { IoMdAdd } from "react-icons/io";
import Toast from 'react-bootstrap/Toast';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import TextAnalyze from './textAnalyze.jsx';





const ChatRoomComments = ({
    selectedTask,
    showComments,
    setShowComments,
    selectedChatRoom
}) => {
    const [commentList, setCommentList] = useState([]);
    const [comment, setComment] = useState({
        'room_id' : 0,
        "comment_id" : 0,
        "task_id" : 0,
        "commenter_id" : 0,
        "task_comment" : '',
        "created_at" : new Date()
    });
    const [showCommentForm, setShowCommentForm] = useState(false);
    // Filter Comments by task
    const filteredComments = 
        commentList.filter((c) => (selectedTask.task_id === c.task_id));

  const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;
      
    //Create a comment
    const handleCommentCreate = async (e) => {
        e.preventDefault();
        const payload = {
            'room_id' : selectedTask.room_id,
            "task_id" : selectedTask.task_id,
            "task_comment" : comment.task_comment,
            'created_at' : comment.created_at
        };
        const requestOptions = {
            method : 'POST',
            headers : {
                "Content-Type" : 'application/json',
                "Authorization" : `Bearer ${sessionStorage.getItem('Bearer')}`
            },
            body: JSON.stringify(payload)
        };

        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/room/task/${payload.task_id}/comment`, requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error creating comment');
            }
            const data = await response.json();
            console.log(data);
            const updateData = {
                'room_id' : data.comment.comment_id,
                "comment_id" : data.comment.comment_id,
                "task_id" : data.comment.task_id,
                "commenter_id" : data.comment.commenter_id,
                "task_comment" : data.comment.task_comment,
                "created_at" : data.comment.created_at,
                "commenter" : data.commenter.username
            }
            setCommentList([
                ...commentList,
                updateData
            ]);
            setComment({
                'room_id' : 0,
                "comment_id" : 0,
                "task_id" : 0,
                "commenter_id" : 0,
                "task_comment" : '',
                "created_at" : new Date()
            });
            console.log(data);
            setShowCommentForm(false);

        } catch (error) {
            console.error('Error: ',error);
        }
    }

    const handleCommentDelete = async (comm) =>{
        const requestOptions = {
            method: 'DELETE',
            headers: {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/room/task/comment/${comm.comment_id}`, requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error deleting comment');
            }
            const data = await response.json();
            setCommentList(commentList.filter((c) => c !== comm));
        } catch (error) {
            console.error('Error: ',error);
        }
    }

    const getComments = async (tas) => {
        const requestOptions = {
            method : 'GET',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${sessionStorage.getItem('Bearer')}`
            }
        }
        
        try {
            const response = await fetch(`${host || 'http://localhost:8123'}/room/task/${tas.task_id}/comment`, requestOptions);
            if (!response.ok){
                const data = await response.json();
                throw new Error(data.message || 'Error fetching comments');
            }
            const data = await response.json();
            console.log(data);
            setCommentList(data);
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    useEffect(() => {
        if(selectedTask.task_id)
            getComments(selectedTask);
    }, [showCommentForm, selectedTask]);
  return (
    <span>
                <Offcanvas style={{zIndex:'9999'}}  show={showComments} placement='bottom' onHide={() => setShowComments(false)} >
                    <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <h3>Comments</h3>
                        <span><strong>{selectedTask.category}</strong>:  {selectedTask.task_title}</span>
                        <span>
                            <IoMdAdd 
                                className='btn-comment-add'
                                onClick = { () => {
                                    setShowCommentForm(true);
                                }}
                            />
                        </span>
                        </Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body style={{display:'flex',flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>
                        {filteredComments.map((c, index) => {
                            return (
                                <Toast key={index} onClose={()=>{
                                    const user = JSON.parse(sessionStorage.getItem('token'));
                                    if (selectedTask.created_by === user.id || selectedChatRoom.room_owner === user.id || c.commenter_id === user.id){
                                        handleCommentDelete(c);
                                    } else {
                                        alert("You cannot delete this comment because you are not the room owner, the task creator, or the person who left the comment.")
                                    }
                                }}>
                                    <Toast.Header>
                                        <strong className="me-auto">Comment from {c.commenter}</strong>
                                        <small>{new Date(c.created_at).toLocaleString()}</small>
                                    </Toast.Header>
                                    <Toast.Body>
                                        <span>{c.task_comment}</span><br/>
                                        <span>{c.emotion ? <TextAnalyze emotion={c.emotion}/> : 'No emotion to report.'}</span>

                                        </Toast.Body>
                                </Toast>
                            )
                        })}
                    </Offcanvas.Body>
                </Offcanvas>
                <Modal 
                    show={showCommentForm}
                    onHide={() => setShowCommentForm(false)}
                    size='lg'
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title>What are your thoughts on <strong>"<u>{selectedTask.task_title}</u>"</strong>?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form className='comment-form-body' onSubmit={ (e) => handleCommentCreate(e)}>
                            <div className='form-group'>
                                <label>Comment</label><br/>
                                <textarea 
                                    type='text'  
                                    placeholder='Comment here...'
                                    required
                                    onChange={ (e) => setComment({
                                        ...comment,
                                        "task_comment" : e.target.value
                                    }) }
                                />
                            </div>
                            <Button variant='primary' type='submit'>
                                Submit
                            </Button>
                        </form>
                    </Modal.Body>
                </Modal>
    </span>
  )
}

export default ChatRoomComments