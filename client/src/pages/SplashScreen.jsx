import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/SplashScreen.css';

const SplashScreen = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000); 

        return () => clearTimeout(timer); 
    }, [navigate]);

    return (
        <div className="splash-container">
            <h1 className="splash-title">SOCIOPEDIA</h1>
            <p className="splash-caption">A perfect platform for the sociopaths!</p>
        </div>
    );
};

export default SplashScreen;
