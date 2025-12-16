import React, { use, useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Keeping your Redux logic
import { Link, useNavigate } from 'react-router-dom';

const Profile = () => {
  // 1. Get User Profile from Redux (Your existing logic)
  const userProfile = useSelector((store) => store.auth.userProfile);
  const token = useSelector((store) => store.auth.accessToken);
  
  // 2. Local state for Posts (New functionality)
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const navigate = useNavigate();

  // 3. Fetch "My Posts" using native fetch
  const getMyPosts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/posts/get/my?page=1&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );
      const res = await response.json();
      if (res.success) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
        setLoadingPosts(false);
    }
  };

  useEffect(() => {
    getMyPosts();
  }, []);

  // 4. Handle navigation to Post Details
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  // Guard clause if Redux state isn't ready yet
  if (!userProfile) {
    return <div className="p-5">Loading Profile...</div>;
  }

  return (
    <div className='w-100'>
      {/* --- PART 1: User Profile Information (Your specific Redux Code) --- */}
      <div className="border-purple w-75 p-5 mx-auto bg-white">
        <div className="container mx-auto d-block">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-5">
              <div className="profile-page-image">
                <img 
                    src={userProfile.account?.avatar?.url || "https://via.placeholder.com/150"} 
                    alt="profile" 
                />
              </div>
              <div>
                <h5>{userProfile.account?.username}</h5>
                <div>{userProfile.bio}</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-5">
              <div className='text-center'>
                <h5>Followers</h5>
                <div>{userProfile.followersCount || 0}</div>
              </div>
              <div className='text-center'>
                <h5>Following</h5>
                <div>{userProfile.followingCount || 0}</div>
              </div>
            </div>
          </div>

          <div className='mt-5 pt-5'>
            <div className='mb-2'>
              <span className='title'>First Name : </span>{userProfile.firstName}
            </div>
            <div className='mb-2'>
              <span className='title'>Last Name : </span>{userProfile.lastName}
            </div>
            <div className='mb-2'>
              <span className='title'>Email : </span>{userProfile.account?.email}
            </div>
            <div className='mb-2'>
              <span className='title'>Phone Number : </span>{userProfile.countryCode}-{userProfile.phoneNumber}
            </div>
            <div className='mb-2'>
              <span className='title'>Location : </span>{userProfile.location}
            </div>
            <div className='mb-2'>
              <span className='title'>Date of Birth : </span>{new Date(userProfile.dob).toLocaleDateString()}
            </div>
            <div className='mb-2'>
              <span className='title'>Bio : </span>{userProfile.bio}
            </div>
            <Link to='/profile-edit'>
                <button className="btn-purple-sm mt-4">Edit</button>
            </Link>
          </div>
        </div>
      </div>

      {/* --- PART 2: My Posts Grid Section (New Logic) --- */}
      <div className="w-75 mx-auto mt-5">
        <h3 className="title mb-4" style={{ color: "var(--clr-purple)" }}>My Posts</h3>
        
        {loadingPosts ? (
            <p>Loading posts...</p>
        ) : posts.length === 0 ? (
            <p className="text-muted">No posts available.</p>
        ) : (
            <div className="row g-4 pb-5">
                {posts.map((post) => (
                    <div key={post._id} className="col-md-4 col-sm-6">
                        <div 
                            className="card border-0 shadow-sm cursor-pointer h-100 overflow-hidden"
                            onClick={() => handlePostClick(post._id)}
                            style={{ borderRadius: "15px" }}
                        >
                            {/* Display 1st Image or Placeholder */}
                            <div style={{ height: "250px", backgroundColor: "#eee" }}>
                                {post.images && post.images.length > 0 ? (
                                    <img 
                                        src={post.images[0].url} 
                                        alt="post thumbnail" 
                                        className="w-100 h-100"
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100 p-3">
                                        <small className="text-muted">{post.content.substring(0, 50)}...</small>
                                    </div>
                                )}
                            </div>
                            
                            {/* Minimal Footer for Grid Item */}
                            <div className="card-body py-2 px-3 bg-light">
                                <div className="d-flex justify-content-between text-muted">
                                    <small><i className="fa-solid fa-heart text-danger"></i> {post.likes}</small>
                                    <small><i className="fa-regular fa-comment"></i> {post.comments}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Profile;