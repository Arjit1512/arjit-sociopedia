import React, { useState } from 'react'
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import '../css/Register.css';
import '../css/Login.css';
import { useMyContext } from './MyContext';

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const {currentUserID,setCurrentUserID} = useMyContext();
    axios.defaults.withCredentials=true;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        //console.log('BACKEND URL: ',process.env.REACT_APP_BACKEND_URL);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/login`, {
                email:email,
                password:password
            });

            //console.log('Response: ',response.data);

            if(response.data==="new-user"){
                alert("User does not exists!")
            }
            else if(response.data.message==="old-user"){
                console.log("Login successful!");
                localStorage.setItem('token',response.data.token);
                setCurrentUserID(response.data.userId);
                navigate("/home");
            }
            else if(response.data==="wrong-password"){
                alert("Wrong password entered!");
            }
            else
            alert("Error occured, kindly try after some time!");
            
        } catch (error) {
            console.log('Error: ', error);
        }
    }

    return (
        <div className='main-div login-div'>
            <form onSubmit={handleSubmit}>
                <label>Email</label>
                <input placeholder='Email' type='text' value={email} onChange={(e) => setEmail(e.target.value)} />
                <label>Password</label>
                <input placeholder='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Submit</button>
                <p>Doesn't have an account? <a onClick={()=>navigate("/register")} >Register</a></p>
            </form>
        </div>
    )
}

export default Login