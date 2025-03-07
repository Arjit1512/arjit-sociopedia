import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useMyContext } from './MyContext'
import '../css/Chat.css'


const Chat = () => {
    const { senderId, setSenderId } = useMyContext();
    const { receiverId, setReceiverId } = useMyContext();
    const { userInfos, setUserInfos } = useMyContext();
    const token = localStorage.getItem('token');
    const [newMessage, setNewMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [flagArray, setFlagArray] = useState([]);
    axios.defaults.withCredentials = true;

    useEffect(() => {
        const displayChat = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/${senderId}/getMessage/${receiverId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                //console.log('Chat History: ', response.data);
                setChatHistory(response.data.all_messages);
            } catch (error) {
                console.log('Error: ', error);
            }
        }

        displayChat();
    }, [senderId, receiverId, flagArray]);

    async function sendMessage() {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/${senderId}/sendMessage/${receiverId}`, { message: newMessage }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            console.log(response.data.message);
            setNewMessage('');
            setFlagArray(prev => [...prev, 1]);
        } catch (error) {
            console.log('Error: ', error);
        }
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Chatting with {userInfos[receiverId]?.userName}</h3>
                <img className='friend-dp' src={userInfos[receiverId]?.dp} alt='friend.dp' />
            </div>

            {(chatHistory.length == 0) ? (<p className='syc'>Start your conversation!!!</p>) : (
                <div className="chat-history">
                    {chatHistory.map((message, index) => (
                        <>
                            <div
                                key={index}
                                className={`message-bubble ${message.userId === senderId ? 'sender' : 'receiver'}`}
                            >
                                <p>{message.message}</p>
                                <p className='msg-time'>{new Date(message.timeStamp).getHours()}:{new Date(message.timeStamp).getMinutes()}</p>
                            </div>
                        </>
                    ))}
                </div>
            )}

            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;