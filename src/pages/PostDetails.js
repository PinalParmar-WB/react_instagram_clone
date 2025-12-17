import React, { use, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userProfile = useSelector((store) => store.auth.userProfile); // To check ownership

  // --- States ---
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Comment Input States
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Helper to get token
  const token = useSelector((store) => store.auth.accessToken);

  // --- API CALLS ---

  // 1. Get Post Details
  const getPostById = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/posts/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await response.json();
      if (res.success) setPost(res.data);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Get Comments
  const getComments = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/comments/post/${id}?page=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await response.json();
      if (res.success) setComments(res.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // 3. Like / Unlike Post
  const handlePostLike = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/like/post/${post._id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await response.json();
      if (res.success) {
        // Update local state manually to reflect change instantly
        setPost((prev) => ({
          ...prev,
          isLiked: !prev.isLiked,
          likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
        }));
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  // 4. Add Comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/comments/post/${post._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newComment }),
        }
      );
      const res = await response.json();
      if (res.success) {
        setNewComment("");
        getComments(); // Refresh comments to get full author details
        setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // 5. Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await response.json();
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setPost(prev => ({ ...prev, comments: prev.comments - 1 }));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // 6. Edit Comment (Start Editing)
  const startEditing = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.content);
  };

  // 7. Save Edited Comment
  const handleSaveEdit = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/comments/${editingCommentId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: editCommentText }),
        }
      );
      const res = await response.json();
      if (res.success) {
        // Update local list
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, content: editCommentText } : c
          )
        );
        setEditingCommentId(null);
        setEditCommentText("");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  // 8. Like / Unlike Comment
  const handleCommentLike = async (commentId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/social-media/like/comment/${commentId}`,
        {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await response.json();
      if(res.success) {
        // Toggle like in local state
        setComments(prev => prev.map(c => {
            if(c._id === commentId) {
                return {
                    ...c,
                    isLiked: !c.isLiked,
                    likes: c.isLiked ? c.likes - 1 : c.likes + 1
                }
            }
            return c;
        }))
      }
    } catch (error) {
        console.error("Error liking comment", error);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (id) {
      getPostById();
      getComments();
    }
    // eslint-disable-next-line
  }, [id]);

  if (loading) return <div className="p-5 text-center title">Loading...</div>;
  if (!post) return <div className="p-5 text-center title">Post not found</div>;

  return (
    <div className="w-75 mx-auto py-4">
      <button className="btn mb-3 p-0 link fw-bold" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left me-2"></i> Back to Profile
      </button>

      <div className="border-purple bg-white p-4">
        <div className="row">
          {/* --- Left Side: Images --- */}
          <div className="col-lg-7 mb-4 mb-lg-0">
            {post.images && post.images.length > 0 ? (
              <div
                id="postCarousel"
                className="carousel slide rounded overflow-hidden shadow-sm"
                data-bs-ride="carousel"
              >
                <div className="carousel-inner">
                  {post.images.map((img, index) => (
                    <div
                      key={img._id}
                      className={`carousel-item ${index === 0 ? "active" : ""}`}
                    >
                      <img
                        src={img.url}
                        className="d-block w-100"
                        alt="post-content"
                        style={{
                          height: "500px",
                          objectFit: "contain",
                          backgroundColor: "#f8f9fa",
                        }}
                      />
                    </div>
                  ))}
                </div>
                {post.images.length > 1 && (
                  <>
                    <button
                      className="carousel-control-prev"
                      type="button"
                      data-bs-target="#postCarousel"
                      data-bs-slide="prev"
                    >
                      <span
                        className="carousel-control-prev-icon bg-dark rounded-circle p-2"
                        aria-hidden="true"
                      ></span>
                    </button>
                    <button
                      className="carousel-control-next"
                      type="button"
                      data-bs-target="#postCarousel"
                      data-bs-slide="next"
                    >
                      <span
                        className="carousel-control-next-icon bg-dark rounded-circle p-2"
                        aria-hidden="true"
                      ></span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div
                className="d-flex align-items-center justify-content-center bg-light rounded"
                style={{ height: "450px" }}
              >
                <span className="text-muted">No Images Available</span>
              </div>
            )}
          </div>

          {/* --- Right Side: Details --- */}
          <div className="col-lg-5 d-flex flex-column">
            {/* Author */}
            <div className="d-flex align-items-center border-bottom pb-3 mb-3">
              <div className="profile-image me-3">
                <img
                  src={post.author?.account?.avatar?.url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={post.author.account.username}
                  onError={(e) => {
                          e.target.onerror = null; // Prevents looping if the fallback also fails
                          // Use UI Avatars to generate an image based on their username
                          e.target.src = `https://ui-avatars.com/api/?name=${post.author.account.username || 'User'}&background=random`;
                          // OR use a static local image:
                          // e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                        }}
                />
              </div>
              <div>
                <h5 className="mb-0 text-capitalize">
                  {post.author.account.username}
                </h5>
                <small className="text-muted">
                  {post.author.location || "Earth"}
                </small>
              </div>
            </div>

            {/* Content */}
            <div className="mb-3 scroll-y" style={{ maxHeight: "200px", overflowY: "auto" }}>
              <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                {post.content}
              </p>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {post.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="badge bg-purple-light text-dark fw-normal"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <small className="text-muted d-block mt-2">
                Posted on {new Date(post.createdAt).toLocaleDateString()}
              </small>
            </div>

            {/* Post Actions (Likes) */}
            <div className="py-3 border-top border-bottom mt-auto">
              <div className="d-flex align-items-center gap-4">
                <div>
                  <button
                    onClick={handlePostLike}
                    className="btn p-0 border-0 bg-transparent"
                  >
                    <i
                      className={`fa-heart ${
                        post.isLiked ? "fa-solid text-danger" : "fa-regular"
                      }`}
                      style={{ fontSize: "1.8rem", cursor: "pointer" }}
                    ></i>
                  </button>
                  <span className="fw-bold ms-2 fs-5">{post.likes} Likes</span>
                </div>
                <div>
                  <i
                    className="fa-regular fa-comment"
                    style={{ fontSize: "1.8rem" }}
                  ></i>
                  <span className="fw-bold ms-2 fs-5">
                    {post.comments} Comments
                  </span>
                </div>
              </div>
            </div>

            {/* --- Comments Section --- */}
            <div className="mt-3 flex-grow-1 d-flex flex-column">
              <h5 className="mb-3">Comments</h5>
              
              {/* Comment List */}
              <div className="flex-grow-1 mb-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {comments.length === 0 ? (
                  <p className="text-muted text-center my-3">No comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="d-flex gap-2 mb-3 align-items-start">
                      <div className="profile-image" style={{width:'35px', height:'35px', flexShrink:0}}>
                        <img
                          src={comment.author?.account?.avatar?.url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt="avatar"
                          style={{width:'100%', height:'100%'}}
                          onError={(e) => {
                          e.target.onerror = null; // Prevents looping if the fallback also fails
                          // Use UI Avatars to generate an image based on their username
                          e.target.src = `https://ui-avatars.com/api/?name=${comment.author?.account?.username || 'User'}&background=random`;
                          // OR use a static local image:
                          // e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                        }}
                        />
                      </div>
                      
                      <div className="flex-grow-1">
                         {/* Check if editing this specific comment */}
                         {editingCommentId === comment._id ? (
                            <div className="input-group input-group-sm">
                                <input 
                                    type="text" 
                                    className="form-control border-purple" 
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                />
                                <button className="btn btn-purple-sm py-0 px-2" onClick={handleSaveEdit}>Save</button>
                                <button className="btn btn-secondary py-0 px-2" onClick={() => setEditingCommentId(null)}>Cancel</button>
                            </div>
                         ) : (
                            // Display Comment
                            <div className="bg-light p-2 rounded">
                                <div className="d-flex justify-content-between align-items-center">
                                    <strong className="text-dark" style={{fontSize: '0.9rem'}}>{comment.author?.account?.username}</strong>
                                    <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </small>
                                </div>
                                <p className="mb-1 text-secondary" style={{fontSize: '0.95rem'}}>{comment.content}</p>
                            </div>
                         )}

                         {/* Comment Actions (Like, Edit, Delete) */}
                         <div className="d-flex gap-3 ms-1 mt-1">
                            <small className="cursor-pointer text-muted" onClick={() => handleCommentLike(comment._id)}>
                                <i className={`fa-heart me-1 ${comment.isLiked ? "fa-solid text-danger" : "fa-regular"}`}></i>
                                {comment.likes || 0}
                            </small>
                            
                            {/* Show Edit/Delete only if current user owns the comment */}
                            {userProfile?._id === comment.author?._id && (
                                <>
                                    <small className="cursor-pointer text-primary" onClick={() => startEditing(comment)}>Edit</small>
                                    <small className="cursor-pointer text-danger" onClick={() => handleDeleteComment(comment._id)}>Delete</small>
                                </>
                            )}
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <div className="input-group">
                <input
                  type="text"
                  className="form-control border-purple"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  className="btn btn-purple-sm"
                  type="button"
                  onClick={handleAddComment}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;