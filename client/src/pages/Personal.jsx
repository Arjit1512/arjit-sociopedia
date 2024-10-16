import React, { useContext, useEffect, useState } from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import { useMyContext } from './MyContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios'
import '../css/Home.css';
import '../css/Personal.css';


const Personal = () => {
    const { currentUserID } = useParams();
    const { userInfos, setUserInfos } = useMyContext();
    const { allPosts, setAllPosts } = useMyContext();
    const { senderId, setSenderId } = useMyContext();
    const { receiverId, setReceiverId } = useMyContext();
    
    const token = localStorage.getItem('token');
    const [data, setData] = useState({
        userName: '',
        dp: '',
        email: '',
        friends: []
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUserID) return;
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/user/${currentUserID}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('CurrentUserID: ', currentUserID);
                //console.log('Response Data: ', response.data);
                setData({ userName: response.data.userName, dp: response.data.dp, email: response.data.email, friends: response.data.friends })

                //console.log('Data: ', data);


            } catch (error) {
                console.log('Error: ', error);
            }
        }
        fetchData();
    }, [currentUserID, token, allPosts, userInfos]);


    //console.log('SANINIKUDU= ', currentUserID);
    //console.log('SANINIKUDU POSTS= ', allPosts);

    async function handleDelete(userId, postId) {
        //console.log('DHEERA : ', postId);
        if (!postId) {
            console.log('Post ID is undefined or null');
            alert('No such post exists')
            return;
        }
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/${userId}/deletePost/${postId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            alert(response.data);
            if (response.data === "Post deleted successfully!") {
                setAllPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
            }


        } catch (error) {
            console.log('Error: ', error);
            alert("Failed to delete post. Please try again.");
        }
    }

    async function handleChat(userId,friendId){
            setSenderId(userId);
            setReceiverId(friendId);
            navigate("/chat");
    }

    return (
        <>
            <div className='entire-personal-div'>
                <img className='bg-img' src={userInfos[currentUserID]?.dp} alt='user-dp' />
                <h2>{data.userName}</h2>
                <div className='friends-div div2'>
                    <h4 className='friend-list'>Friends List</h4>
                    {data?.friends.map((friend) => {
                        return (
                            <div className='friends p flex-row'>
                                <img src={userInfos[friend]?.dp} alt='friend.jpg' />
                                <h3 className='name-friend'>{userInfos[friend]?.userName}</h3>
                                <button className='chat-button' style={{cursor:"pointer"}} onClick={()=>handleChat(currentUserID,friend)}>Chat</button>
                            </div>
                        )
                    })}
                </div>

                <div className='personal-posts'>
                    <h2>Posts</h2>

                    {allPosts?.map((post) => {
                        //console.log('Post:', post);
                        return (
                            post.userId === currentUserID && (
                                <div className='seperate-div' key={post._id}>
                                    <div className='s-div'>
                                        <h3>{post.description}</h3>
                                        <img src={post?.image} alt='friend.jpg' />
                                        <FontAwesomeIcon
                                            icon={faTrash} 
                                            className='trash-icon'
                                            onClick={() => handleDelete(currentUserID, post._id)}
                                        />
                                        <div className='move-h5 mh5'>
                                            <h5>Likes: <span style={{color:"gray"}}>{post.likes?.length || 0}</span></h5>
                                        </div>
                                    </div>
                                </div>
                            )
                        );
                    })}

                </div>


            </div>

        </>
    )
}

export default Personal