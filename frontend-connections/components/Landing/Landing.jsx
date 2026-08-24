import React, { useState } from 'react';
import {jwtDecode} from "jwt-decode";
import './Landing.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

const Landing = () =>{
  const [isRegister, setIsRegister] = useState(false);
  const [authCredentials, setAuthCredentials] = useState({
    "email" : "",
    "age" : 0,
    "username" : "",
    "password" : ""
  });

  const host = import.meta.env.VITE_BACKEND 
  || 
    import.meta.env.VITE_HOST 
    || 
      `http://localhost:8123`;
  const navigate = useNavigate();

  const handleSubmit = async (event) =>{
    event.preventDefault();
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify(authCredentials)
    };

    try {
      const response = await fetch(`${host || 'http://localhost:8123'}/${!isRegister ? 'login' : 'users'}`, requestOptions);
<<<<<<< HEAD
=======
      if (!response.ok){
        const data = await response.json();

        throw new Error(data.message || "Authentication failed");
      }
>>>>>>> 3b394f2 (removed video)
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Authentication failed");
      const decoded = jwtDecode(data.token);
      sessionStorage.setItem('Bearer', data.token);
      sessionStorage.setItem('token', JSON.stringify(decoded));
      console.log(decoded);
      setAuthCredentials({
        ...authCredentials,
        "username" : "",
        "password" : "",
        "age" : 0,
        "email" : ""
        });
        navigate('/tasks');
    } catch(error) {
        if (!isRegister)
          alert('Invalid Credentials');
        else
          alert('Username/Email already in use');
      console.error('Error:', error);
    }
  }

  const guestGeneration = async () => {
    event.preventDefault();
    const guest = generateGuestCredentials();
    const payload = {
      "username" : guest.username,
      "password" : guest.password,
      "age" : 16,
      "email" : `${guest.username}@guestCon.com`
    }
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify(payload)
    }
    try {
      const response = await fetch(`${host || 'http://localhost:8123'}/${'users'}`, requestOptions);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Authentication failed");
      const decoded = jwtDecode(data.token);
      sessionStorage.setItem('Bearer', data.token);
      sessionStorage.setItem('token', JSON.stringify(decoded));
      console.log(decoded);
      alert(`Hey your guest credentials are\nUsername : ${guest.username}
          Password : ${guest.password} \n 
          If you want to log back in later you can use this information.`);
      setAuthCredentials({
        ...authCredentials,
        "username" : "",
        "password" : "",
        "age" : 0,
        "email" : ""
      });
      navigate('/tasks');
    } catch(error) {
      console.error('Error:', error);
    }
  }

  const generateGuestCredentials = () => {
    const guestUsername = `Guest-${uuidv4().slice(0, 8)}`;
    const passLength = 12;
    const charset = 
      "abcedfghijklmnopqrstuvwyz" +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "1234567890" +
      "!@#$%^&*()_+~\\`|}{[]:;?><,./-=";
    let guestPassword = "";
    for (let i = 0; i < passLength; i++){
      guestPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return { username: guestUsername, password: guestPassword };
  }

    return (
    <>
      <div className="landing-page">
        <h1 style={{justifySelf:'flex-start',alignSelf:'flex-start',position:'absolute'}}>Lively Connections</h1>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${!isRegister ? "login" : "register"}`}
            initial={{ opacity: 0, x: !isRegister ? 100 : -100  }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: !isRegister ? -100 : 100 }}
            transition={{ duration: 0.4 }}
            className={`auth-card ${isRegister ? "login" : "register"}`}
          >
            <form className='auth-form' onSubmit={handleSubmit}>
              {!isRegister ?               
              <>
              <h2>Login</h2>
              <p>Don't have an account? <Link onClick={() => setIsRegister(true)}><strong>Sign Up</strong></Link></p>
              <div className="form-group">
                <label>Username</label><br/>
                <input type="text" placeholder='Username' value={authCredentials.username} onChange={(e) => setAuthCredentials({...authCredentials, username: e.target.value})} required/>
              </div>
              <div className="form-group">
                <label>Password</label><br/>
                <input type="password" placeholder='Password' value={authCredentials.password} onChange={(e) => setAuthCredentials({...authCredentials, password: e.target.value})} required/>
              </div>
              <p><strong>Forgot Password?</strong></p>
              <button type="submit" className="btn btn-primary">Login</button>
              </> :             
              <>
            <h2>Register</h2>
            <p>Already have an account? <Link onClick={() => setIsRegister(false)}><strong>Login</strong></Link></p>
            <div className="form-group">
                <label>Email</label><br/>
                <input type="email" placeholder='Email' value={authCredentials.email} onChange={(e) => setAuthCredentials({...authCredentials, email: e.target.value})} required/>
            </div>
            <div className="form-group">
                <label>Age</label><br/>
                <input type="number" min={16} max={120} style={{width:'190px'}} value={authCredentials.age} onChange={(e) => setAuthCredentials({...authCredentials, age: e.target.value})} required/>
            </div>
            <div className="form-group">
              <label>Username</label><br/>
              <input type="text" placeholder='Username' value={authCredentials.username} onChange={(e) => setAuthCredentials({...authCredentials, username: e.target.value})} required/>
            </div>
            <div className="form-group">
              <label>Password</label><br/>
              <input type="password" placeholder='Password' value={authCredentials.password} onChange={(e) => setAuthCredentials({...authCredentials, password: e.target.value})} required/>
            </div>
            <p><strong>Forgot Password?</strong></p>
            <button type="submit" className="btn btn-primary">Register</button>
            </> 
            }
            </form>
            <div className="guest-section">
              <h3>Closer than you think. Together lets bridge a connection.</h3>
              <button  onClick={guestGeneration} className='btn btn-primary'>Guest Sign-In</button>
            </div>
          </motion.div>

        </AnimatePresence>
      </div>
    </>
    )
}

export default Landing