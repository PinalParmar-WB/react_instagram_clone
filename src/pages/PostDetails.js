import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PostDetails = () => {
  const { id } = useParams(); // Get postId from URL
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Post by ID
  const getPostById = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(
        `https://api.freeapi.app/api/v1/social-media/posts/${id}`,
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
        setPost(res.data);
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      getPostById();
    }
  }, [id]);

  if (loading) return <div className="p-5">Loading post details...</div>;
  if (!post) return <div className="p-5">Post not found.</div>;

  return (
    <div className="secondary-container overflow-auto">
      <button className="btn btn-link link mb-3" onClick={() => navigate(-1)}>
        &larr; Back to Profile
      </button>

      <div className="border-purple p-4 bg-white">
        <div className="row">
          {/* Left Side: Images (Carousel) */}
          <div className="col-lg-6 mb-4 mb-lg-0">
            {post.images && post.images.length > 0 ? (
              <div
                id="postCarousel"
                className="carousel slide rounded overflow-hidden"
                data-bs-ride="carousel"
                style={{ border: "1px solid #ddd" }}
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
                        alt="post-img"
                        style={{ height: "400px", objectFit: "contain", backgroundColor: "#000" }}
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
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button
                      className="carousel-control-next"
                      type="button"
                      data-bs-target="#postCarousel"
                      data-bs-slide="next"
                    >
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
                <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{height: "300px"}}>
                    <span className="text-muted">No Images</span>
                </div>
            )}
          </div>

          {/* Right Side: Details */}
          <div className="col-lg-6">
            {/* Author Header */}
            <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
              <div className="profile-image me-3">
                <img
                  src={post.author.account.avatar.url}
                  alt={post.author.account.username}
                />
              </div>
              <div>
                <h5 className="mb-0">{post.author.account.username}</h5>
                <small className="text-muted">
                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                </small>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p style={{ whiteSpace: "pre-wrap", fontSize: "1.1rem" }}>
                {post.content}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-4">
                {post.tags.map((tag, index) => (
                    <span key={index} className="badge bg-purple-light me-2 mb-2 text-dark">
                        #{tag}
                    </span>
                ))}
            </div>

            {/* Stats */}
            <div className="d-flex gap-4 mt-auto">
              <div className="d-flex align-items-center gap-2">
                <i className={`fa-heart ${post.isLiked ? 'fa-solid text-danger' : 'fa-regular'}`} style={{fontSize: "1.5rem"}}></i>
                <span className="fs-5 fw-bold">{post.likes} Likes</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="fa-regular fa-comment" style={{fontSize: "1.5rem"}}></i>
                <span className="fs-5 fw-bold">{post.comments} Comments</span>
              </div>
            </div>
            
            <div className="mt-5">
                {/* Placeholder for action buttons like Like/Comment implementation later */}
                <button className="btn-purple-sm me-2">
                    <i className="fa-regular fa-heart me-2"></i>Like
                </button>
                <button className="btn border-purple btn-light fw-bold" style={{color: 'var(--clr-purple)'}}>
                    Comment
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;