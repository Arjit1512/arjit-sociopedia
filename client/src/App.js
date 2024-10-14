import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Register from './pages/Register';
import Login from "./pages/Login";
import Personal from "./pages/Personal";
import SplashScreen from "./pages/SplashScreen";
import { MyProvider } from "./pages/MyContext";
import Chat from "./pages/Chat";

const App = () => {
  return (
    <>
      <MyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/personal/:currentUserID" element={<Personal />} />
            <Route path="/" element={<SplashScreen />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </BrowserRouter>
      </MyProvider>
    </>
  )
}

export default App;