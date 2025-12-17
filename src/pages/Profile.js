import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setUserProfile } from '../store/authSlice';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const userProfile = useSelector((store) => store.auth.userProfile);
  const token = useSelector((store) => store.auth.accessToken);
  
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 1. Fetch Profile Data 
  const getFreshProfile = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/social-media/profile`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer ' + token,
            },
        });
        const res = await response.json();
        if(res.success){
            if (JSON.stringify(res.data) !== JSON.stringify(userProfile)) {
                dispatch(setUserProfile(res.data));
            }
        }
    } catch (error) {
        console.error("Error refreshing profile:", error);
    }
  };

  // 2. Fetch "My Posts"
  const getMyPosts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/posts/get/my?page=1&limit=10`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
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

  // --- 3. Handle Delete Post ---
  const handleDeletePost = async (e, postId) => {
    e.stopPropagation(); // Prevent opening the post details
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/posts/${postId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await response.json();

      if (res.success) {
        // Remove the deleted post from the local UI state instantly
        setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      } else {
        alert(res.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // --- 4. Handle Edit Post ---
  const handleEditPost = (e, postId) => {
    e.stopPropagation(); // Prevent opening the post details
    navigate(`/post/edit/${postId}`); // Navigate to the Edit Page we created earlier
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  useEffect(() => {
    getFreshProfile();
    getMyPosts();
    // eslint-disable-next-line
  }, []); 

  // Safe check for rendering
  if (!userProfile) {
     return <div className="p-5 text-center">Loading Profile...</div>;
  }

  return (
    <div className='w-100'>
      <div className="border-purple w-75 p-5 mx-auto bg-white" style={{borderRadius: "10px"}}>
        <div className="container mx-auto d-block">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-5">
              <div className="profile-page-image" style={{width: "100px", height: "100px", overflow: "hidden", borderRadius: "50%"}}>
                <img 
                    src={userProfile.account?.avatar?.url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt="profile" 
                    className="w-100 h-100"
                    style={{objectFit: "cover"}}
                />
              </div>
              <div>
                <h5>{userProfile.account?.username}</h5>
                <div className="text-muted">{userProfile.bio}</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-5">
              <Link to='/followers' className='link text-decoration-none'>
                <div className='text-center cursor-pointer'>
                  <h5 className="text-dark">Followers</h5>
                  <div className="fs-5 fw-bold">{userProfile.followersCount || 0}</div>
                </div>
              </Link>
              <Link to="/following" className='link text-decoration-none'>
                <div className='text-center cursor-pointer'>
                  <h5 className="text-dark">Following</h5>
                  <div className="fs-5 fw-bold">{userProfile.followingCount || 0}</div>
                </div>
              </Link>
            </div>
          </div>

          <div className='mt-5 pt-3 border-top'>
            <div className='mb-2'><strong className='me-2'>First Name:</strong>{userProfile.firstName}</div>
            <div className='mb-2'><strong className='me-2'>Last Name:</strong>{userProfile.lastName}</div>
            <div className='mb-2'><strong className='me-2'>Email:</strong>{userProfile.account?.email}</div>
            <div className='mb-2'><strong className='me-2'>Phone:</strong>{userProfile.countryCode} {userProfile.phoneNumber}</div>
            <div className='mb-2'><strong className='me-2'>Location:</strong>{userProfile.location}</div>
            <div className='mb-2'><strong className='me-2'>DOB:</strong>{userProfile.dob ? new Date(userProfile.dob).toLocaleDateString() : 'N/A'}</div>
            <Link to='/profile-edit'><button className="btn-purple-sm mt-4">Edit Profile</button></Link>
          </div>
        </div>
      </div>

      <div className="w-75 mx-auto mt-5">
        <h3 className="mb-4" style={{ color: "var(--clr-purple)" }}>My Posts</h3>
        {loadingPosts ? (
            <p className="text-center">Loading posts...</p>
        ) : posts.length === 0 ? (
            <div className="text-center p-5 bg-light rounded"><p className="text-muted mb-0">No posts yet.</p></div>
        ) : (
            <div className="row g-4 pb-5">
                {posts.map((post) => (
                    <div key={post._id} className="col-md-4 col-sm-6">
                        <div 
                          className="card border-0 shadow-sm cursor-pointer h-100 overflow-hidden position-relative" 
                          onClick={() => handlePostClick(post._id)} 
                          style={{ borderRadius: "15px" }}
                        >
                            {/* --- ACTION BUTTONS (Edit / Delete) --- */}
                            <div className="position-absolute top-0 end-0 p-2 d-flex gap-2" style={{ zIndex: 10 }}>
                                <button 
                                    className="btn btn-light btn-sm rounded-circle shadow-sm text-primary"
                                    style={{width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center'}}
                                    onClick={(e) => handleEditPost(e, post._id)}
                                    title="Edit Post"
                                >
                                    <i className="fa-solid fa-pen"></i>
                                </button>
                                <button 
                                    className="btn btn-light btn-sm rounded-circle shadow-sm text-danger"
                                    style={{width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center'}}
                                    onClick={(e) => handleDeletePost(e, post._id)}
                                    title="Delete Post"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>

                            <div style={{ height: "250px", backgroundColor: "#eee" }}>
                                {post.images && post.images.length > 0 ? (
                                    <img src={post.images[0].url} alt="post" className="w-100 h-100" style={{ objectFit: "cover" }} />
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100 p-3 text-center"><small className="text-muted">{post.content?.substring(0, 50)}</small></div>
                                )}
                            </div>
                            <div className="card-body py-2 px-3 bg-white">
                                <div className="d-flex justify-content-between text-muted">
                                    <small><i className="fa-solid fa-heart text-danger"></i> {post.likes}</small>
                                    <small><i className="fa-solid fa-comment text-primary"></i> {post.comments}</small>
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