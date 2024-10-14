import React, { createContext, useContext, useState } from "react";

const MyContext = createContext();
 
export const MyProvider = ({children}) => {
    const [globalArray,setGlobalArray] = useState([]);
    const [currentUserID,setCurrentUserID] = useState(null);
    const [userInfos, setUserInfos] = useState({});
    const [allPosts, setAllPosts] = useState([]);
    const [senderId,setSenderId] = useState('');
    const [receiverId,setReceiverId] = useState('');
    


    return (
        <>
            <MyContext.Provider value={{globalArray,setGlobalArray,currentUserID,setCurrentUserID,userInfos,setUserInfos,allPosts,setAllPosts,senderId,setSenderId,receiverId,setReceiverId}}>
             {children}
            </MyContext.Provider>
        </>
    )
}

export const useMyContext = () => useContext(MyContext);