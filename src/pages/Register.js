import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setUser } from '../store/authSlice';

const Register = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const userName = useRef();
  const password = useRef();
  const email = useRef();
  const profileImage = useRef();
  const dispatch = useDispatch();

  function isLowerCase(str) {
    return str === str.toLowerCase();
  }

  const updateAvatar = async () => {
    const file = profileImage.current.files[0];

    if (!file) {
      alert("Please select an image");
      return null;
    }

    // OPTIONAL: Client-side check (e.g., limit to 2MB)
    // 2MB = 2 * 1024 * 1024 bytes
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large! Please upload an image smaller than 2MB.");
      return null;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const url = process.env.REACT_APP_BASE_URL + "/users/avatar";

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
          accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();

      // CHECK FOR ERRORS HERE
      if (!response.ok || !data.success) {
        // This will grab "File too large" from your backend response
        alert(data.message || "Failed to upload profile image.");
        console.error("Avatar upload error:", data);
        return null; 
      }

      console.log("Avatar updated:", data);
      return data.data.avatar;
    } catch (error) {
      console.error("Avatar update failed:", error);
      alert("Something went wrong uploading the image.");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (
      !userName.current.value ||
      !password.current.value ||
      !email.current.value
    ) {
      alert('Please fill all the fields');
      return;
    }

    if (!profileImage.current.files[0]) {
      alert("Please select an image");
      return;
    }

    if(!isLowerCase(userName.current.value)){
      alert('Username must be in lowercase');
      return;
    }

    const url = process.env.REACT_APP_BASE_URL + '/users/register';

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: email.current.value,
        role : 'USER',
        password: password.current.value,
        username: userName.current.value,
      }),
    };

    try {
      if(!isLoggedIn){
        // 1. REGISTER
        const response = await fetch(url, options);
        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Registration failed");
          return;
        }
      }
      
      // 2. LOGIN
      const loginUrl = process.env.REACT_APP_BASE_URL + '/users/login';
      const loginOptions = {
        method: 'POST',
        headers: {accept: 'application/json', 'content-type': 'application/json'},
        body: JSON.stringify({"password":password.current.value,"username":userName.current.value})
      };
  
      try {
        const loginRes = await fetch(loginUrl, loginOptions);
        const loginData = await loginRes.json();

        if (!loginRes.ok || !loginData.success) {
          alert(loginData.message || "Login failed"); 
          return;
        }
        
        // Save token
        localStorage.setItem('accessToken', loginData.data.accessToken);
        setIsLoggedIn(true);

        // 3. UPLOAD AVATAR
        const avatar = await updateAvatar();
        if (!avatar) {
          console.log("Proceeding without avatar due to upload failure.");
          return;
        }
        // Even if avatar fails (is null), we proceed with the user object
        // so the user can still use the app, just without a profile pic.
        const loggedInUser = { ...loginData.data.user, avatar: avatar || undefined };
        
        console.log('Logged in user after registration:', loggedInUser);
        dispatch(setUser({user: loggedInUser, accessToken: loginData.data.accessToken}));
        navigate('/home');

      } catch (error) {
        console.error(error);
        alert("Login failed during registration process.");
      }
    } catch (error) {
      alert('Registration failed. Please try again. ' + error.message);
      console.error(error);
    }
  };

  return (
    <>
      <div className="w-25 mx-auto d-block mb-3 mt-5">
        <img src="/images/text.png" alt="logo" className="w-100" />
      </div>
      <div className="w-50 p-5 mx-auto d-block border-purple">
        <form className="w-100" onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3">
            <label className="form-label fs-5">Select profile image :</label>
            <input className="form-control" ref={profileImage} type="file" />
          </div>
          <div className="mb-3">
            <label className="form-label fs-5">
              User Name :{' '}
            </label>
            <input
              type="text"
              ref={userName}
              className="form-control"
              placeholder="Enter user name"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fs-5">
              Email :
            </label>
            <input
              type="email"
              ref={email}
              className="form-control"
              placeholder="Enter email"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fs-5">
              Password :
            </label>
            <input
              type="password"
              className="form-control" 
              placeholder="Enter password"
              ref={password}
            />
          </div>
          <p>
            <Link to="/login" className="cursor-pointer link">
              Already have an account? Log In.
            </Link>
          </p>
          <button onClick={handleSubmit} className="btn-purple mt-4">Sign Up</button>
        </form>
      </div>
    </>
  );
};

export default Register;