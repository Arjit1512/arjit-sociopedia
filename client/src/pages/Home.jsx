import React, { useEffect, useState, useRef } from 'react'
import '../css/Home.css';
import { useMyContext } from './MyContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';
import { faMapMarkerAlt, faBriefcase, faMoon } from '@fortawesome/free-solid-svg-icons';
const Home = () => {

  const { currentUserID, setCurrentUserID } = useMyContext();
  const { allPosts, setAllPosts } = useMyContext();
  const { userInfos, setUserInfos } = useMyContext();
  const [description, setDescription] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');
  axios.defaults.withCredentials=true;

  const [data, setData] = useState({
    userName: '',
    dp: '',
    email: '',
    friends: []
  });


  useEffect(() => {

    if (!currentUserID && !data) return; // to stop infinite re-rendering
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/user/${currentUserID}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('CurrentUserID: ', currentUserID);
        console.log('Response Data: ', response.data);
        setData({ userName: response.data.userName, dp: response.data.dp, email: response.data.email, friends: response.data.friends })

        console.log('Data: ', data);


      } catch (error) {
        console.log('Error: ', error);
      }
    }

    const fetchAllPosts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/posts`);
        setAllPosts(response.data);

      } catch (error) {
        console.log('Error: ', error);
      }
    }


    //get all user details stored in an array
    const storingUserInfo = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users`);

        console.log("All users data: ", response.data);
        const tempArray = response.data.reduce((acc, user) => {
          acc[user._id] = {
            userName: user.userName,
            email: user.email,
            dp: user.dp,
            friends: user.friends
          };
          return acc;
        }, {});

        setUserInfos(tempArray);


      } catch (error) {
        console.log('Error: ', error);
      }
    }



    fetchData();
    fetchAllPosts();
    storingUserInfo();


  }, [currentUserID, token, setAllPosts, setUserInfos, setData]); ///YOU NEED TO CHANGE THIS AFTERWARDS

  const creatingPost = async (req, res) => {
    const formData = new FormData();

    formData.append('description', description);
    formData.append('image', imagePath);
    console.log("IMAGEPATH BEFORE--------------------->",imagePath);
        

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/${currentUserID}/createPost`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('RESPONSE UNGAMMA!  ====', response.data)
      if (response.data.message === "Post created successfully!") {
        alert("Post created successfully!");
        //window.location.reload();

         
        const newData = ({
          description:description,
          image:response.data.imagePath,
          userId:currentUserID,
          _id:response.data.postId
        });

        setAllPosts((prevPosts) => [...prevPosts,newData]);

        setDescription('');
        setImagePath('');
        fileInputRef.current.value = '';
      }



    } catch (error) {
      console.log('Error: ', error);
    }
  }


  async function handleAddFriend(friendId) {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/${currentUserID}/addFriend/${friendId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      alert(response.data);
      //window.location.reload();

      //add friendId into this array
      setData((prevData) => ({
        ...prevData,
        friends: [...prevData.friends, friendId]
      }))

    } catch (error) {
      console.log('Error: ', error);
    }
  }

  async function handleRemoveFriend(friendId) {
    console.log('devara: ',currentUserID)
    console.log('vara: ',friendId)
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/${currentUserID}/removeFriend/${friendId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      alert(response.data);
      //window.location.reload();

      setData(prevData => ({
        ...prevData,
        friends: prevData.friends.filter(friend => friend !== friendId)
      }));

    } catch (error) {
      console.log('Error: ', error);
    }
  }

  console.log("All users INFO data: ", userInfos);
  console.log("All POSTS: ", allPosts);


  //console.log('PARTICULAR USER:::: ', userInfos["66f3ce9cf1aef7f45418325a"]?.friends)

  const handleBgChange = () => {
    if (!isDarkMode) {
      document.body.style.backgroundColor = '#D8D2C2';

    } else {
      document.body.style.backgroundColor = '#F5F5F7';
    }
    setIsDarkMode(!isDarkMode);
  };
  const handleLogout = async () => {
    localStorage.removeItem('token');
    setCurrentUserID(null);
    navigate("/login");
  }

  return (
    <div>
      <div className='navbar'>
        <h2>Sociopedia</h2>
        <input type='search' placeholder='search' />
        <button className='moon-button' onClick={handleBgChange}>
          <FontAwesomeIcon icon={faMoon} />
        </button>
        <div className='logout-div'>
          <h4>{userInfos[currentUserID]?.userName}</h4>
          <FontAwesomeIcon className='down-css' onClick={() => setIsOpen(!isOpen)} icon={faCaretDown} />
          {isOpen && (
            <button className='logout' onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>

      <div className='section-2'>
        <div className='personal-section'>
          <div className='first-div'>
            <img src={data.dp} alt='user.img' />
            <div className='flex-col move-up'>
              <h2 className='user-name' onClick={() => navigate(`/personal/${currentUserID}`)}>{data.userName}</h2>
              <p className='fr-length'>{data.friends.length} friends</p>
              <div className='info'>
                <div className='flex-row huge'>
                  <FontAwesomeIcon icon={faMapMarkerAlt} /><p className='location-text'>New York, USA</p>
                </div>
                <div className='flex-row huge'>

                  <FontAwesomeIcon icon={faBriefcase} /><p className='profession-text'>Software Engineer</p>
                </div>
              </div>
            </div>
          </div>
          <div className='grey-border'></div>
          <div className='second-div'>
            <div className='space-btw'>
              <h5>Who's viewed your profile </h5>
              <p>5619</p>
            </div>
            <div className='space-btw'>
              <h5>Impressions of your Posts </h5>
              <p>2210</p>
            </div>
          </div>
          <div className='grey-border two'></div>
          <div className='last-div'>
            <h3>Social Profiles</h3>
            <div className='social-icon'>
              <FontAwesomeIcon icon={faTwitter} size='2x' />
              <h5>Twitter</h5>
            </div>
            <div className='social-icon'>
              <FontAwesomeIcon icon={faLinkedin} size='2x' />
              <h5>LinkedIn</h5>
            </div>
          </div>
        </div>
      </div>

      <div className='home-feed'>

        <div className='post-div'>
          <h3>What's on your mind today?</h3>
          <div className='first-div flex-row'>
            <img src={data.dp} alt='user.img' />
            <div className='move-caption'>
              <input type='text' className='caption' value={description} placeholder='Give your post a perfect caption!' onChange={(e) => setDescription(e.target.value)} />

            </div>
          </div>
          <div className='move-input space-btw'>
            <input type='file' ref={fileInputRef} onChange={(e) => setImagePath(e.target.files[0])} />
            <button onClick={creatingPost}>Post</button>
          </div>
        </div>








        {allPosts.map((item) => {
          return (
            <div className='card'>
              <div className='flex-row'>
                <img className='dp' src={userInfos[item.userId]?.dp} alt='user.img' />
                <div className='move-dp'>
                  <h4>{userInfos[item.userId]?.userName}</h4>
                </div>
                {item.userId !== currentUserID && (
                  <div className='friends-button'>
                    <button onClick={() => handleAddFriend(item.userId)}>Add Friend</button>
                  </div>
                )}
              </div>
              <p>{item.description}</p>

              <div className='outside-img'>
                <img src={item.image} alt='feed.img' />
              </div>
            </div>
          )

        })}
      </div>


      <div className='ad'>
        <div className='space-btw'>
          <h4 className='sponsered'>Sponsered</h4>
          <h4 className='create-ad'>Create Ad</h4>
        </div>
        <img src='https://sociopedia-two.vercel.app/assets/info4.jpeg' alt='ad.jpg' />
        <div className='space-btw'>
          <h4 className='sponsered'>Mika Cosmetics</h4>
          <h4 className='create-ad'>mikacosmetics.com</h4>
        </div>
        <p>Your pathway to stunning and immaculate
          beauty and made <br />sure your skin is exfoliating
          skin and shining like light. As a rapidly<br />
          growing company, we provide an exciting environment.</p>
      </div>

      <div className='friends-div'>
        <h4 className='friend-list'>Friend List</h4>
        {userInfos[currentUserID]?.friends.map((friend) => {
          return (
            <div className='friends flex-row'>
              <img src={userInfos[friend]?.dp} alt='friend.jpg' />
              <h3 className='name-friend'>{userInfos[friend]?.userName}</h3>
              <button className='rf' onClick={() => handleRemoveFriend(friend)}>Remove Friend</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Home