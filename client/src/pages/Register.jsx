import React, { useState } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Register.css';
import { useMyContext } from './MyContext';


const Register = () => {

    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dp, setDp] = useState(null);
    const currentUserID = localStorage.getItem('currentUserID');
    const token = localStorage.getItem('token');
    axios.defaults.withCredentials=true;
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('userName', userName);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('dp', dp);


        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

            //console.log('Response: ', response.data);

            if (response.data === "old-user") {
                alert("User already exists!")
            }
            else if (response.data.message === "new-user") {
                console.log("Registration successful!");
                localStorage.setItem('token',response.data.token);
                localStorage.setItem('currentUserID',response.data.userId);
                navigate("/home");
            }
            else if (response.data.error === "Enter all the details!") {
                alert("Enter all the details!");
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
                <label>User Name</label>
                <input placeholder='UserName' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} />
                <label>Email</label>
                <input placeholder='Email' type='text' value={email} onChange={(e) => setEmail(e.target.value)} />
                <label>Password</label>
                <input placeholder='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
                <label>Upload picture here</label>
                <input type='file' accept="image/*" onChange={(e) => setDp(e.target.files[0])} />
                <button type="submit">Submit</button>
                <p>Already have an account? <a onClick={() => navigate("/login")} >Login</a></p>
            </form>
        </div>
    )
}

export default Register