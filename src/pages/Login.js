import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { setUser } from "../store/authSlice";
import { useDispatch } from "react-redux";

export default function Login() {
  const navigate = useNavigate();
  const userName = useRef();
  const password = useRef();
  const dispatch = useDispatch();

  const handleSubmit = async () => {
    if(!userName.current.value || !password.current.value){
      alert("Please fill all the fields");
      return;
    }
    const url = process.env.REACT_APP_BASE_URL + '/users/login';
    
    const options = {
      method: 'POST',
      headers: {accept: 'application/json', 'content-type': 'application/json'},
      body: JSON.stringify({"password":password.current.value,"username":userName.current.value})
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      console.log(result);

      // 2. ERROR HANDLING (Fixes the crash)
      // If response is not OK (e.g., 404) or success is false
      if (!response.ok || !result.success) {
        // Display the error message from the backend ("User does not exist")
        alert(result.message || "Login failed"); 
        return; // Stop execution here so we don't hit the null error
      }

      // 3. SUCCESS HANDLING
      // We MUST save to localStorage for the Page Refresh logic to work
      localStorage.setItem('user', JSON.stringify(result.data.user));
      localStorage.setItem('accessToken', result.data.accessToken);

      // Update Redux
      dispatch(setUser({user: result.data.user, accessToken: result.data.accessToken}));
      
      // Go to Home
      navigate('/home');
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <>
        <div className="w-25 mx-auto d-block mb-3 mt-5">
            <img src='/images/text.png' alt="logo" className="w-100"/>
        </div>
        <div className="w-50 p-5 mx-auto d-block border-purple">
            <form className="w-100" onSubmit={(e) => e.preventDefault()}>
                <div className="mb-3">
                  <label className="form-label fs-5">User Name : </label>
                  <input type="text" ref={userName} className="form-control" placeholder="Enter user name" required/>
                </div>
                <div className="mb-3">
                  <label className="form-label fs-5">Password :</label>
                  <input type="password" ref={password} className="form-control" placeholder="Enter password" required/>
                </div>
                <p><Link to='/register' className="cursor-pointer link">Are you new to instagram? Sign Up.</Link></p>
                <button onClick={handleSubmit} className="btn-purple mt-4">Login</button>
            </form>
        </div>
    </>
  );
}