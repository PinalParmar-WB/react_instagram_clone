// 1. Remove 'use' (it's not needed). Keep 'useEffect' for the safety check.
import { useEffect } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { removeUser } from '../store/authSlice';

const Home = () => {
  const user = useSelector((store) => store.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 2. SAFETY CHECK: If user is null (e.g. after refresh), send back to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(removeUser());
    navigate('/login');
  };

  // Prevent rendering if user is missing (stops "Cannot read properties of null")
  if (!user) return null; 

  return (
    <div>
      {/* HEADER SECTION */}
      <div className="w-100 bg-purple-light p-2 fs-5 d-flex justify-content-between align-items-center pe-2">
        <img src="/images/text.png" width={200} alt="logo" />
        <span>{user.username}</span>
      </div>

      {/* MAIN BODY: SIDEBAR + CONTENT (OUTLET) */}
      <div className="d-flex main-container">
        {/* SIDEBAR (Left Side) */}
        <div className="sidebar">
          <nav>
            <Link to="/home" className="link">
              <div className="nav-item ms-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  className="bi bi-house-door-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
                </svg>
                <span className="ms-2">Home</span>
              </div>
            </Link>
            <Link to="/create-post" className="link">
              <div className="nav-item ms-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  className="bi bi-plus-square"
                  viewBox="0 0 16 16"
                >
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                </svg>
                <span className="ms-2">Create</span>
              </div>
            </Link>
            <Link to="/bookmarks" className="link">
              <div className="nav-item ms-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  className="bi bi-bookmark"
                  viewBox="0 0 16 16"
                >
                  <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z" />
                </svg>
                <span className="ms-2">Saved Posts</span>
              </div>
            </Link>
            <Link to="/profile" className="link">
              <div className="nav-item d-flex align-items-center">
                {/* 3. Added overflow hidden and object-fit to prevent image distortion */}
                <div className="profile-image" style={{overflow: 'hidden', borderRadius: '50%'}}>
                  <img 
                    src={user.avatar?.url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt="profile" 
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </div>
                <span className="ms-2">Profile</span>
              </div>
            </Link>
            <div onClick={handleLogout} className="link">
              <div className="nav-item ms-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  className="bi bi-box-arrow-right"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
                  />
                  <path
                    fillRule="evenodd"
                    d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
                  />
                </svg>
                <span className="ms-2 cursor-pointer">Log Out</span>
              </div>
            </div>
          </nav>
        </div>

        {/* CONTENT AREA (White Space - Right Side) */}
        <div className="secondary-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;