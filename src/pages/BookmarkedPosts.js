import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const BookmarkedPosts = () => {
  const navigate = useNavigate();

  // --- States ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const isFetchingRef = useRef(false);
  const token = useSelector((store) => store.auth.accessToken);

  // --- 1. Fetch Bookmarks Function ---
  const fetchBookmarks = async (pageNum) => {
    if (isFetchingRef.current) return;
    if (pageNum > 1 && !hasNextPage) return;

    setLoading(true);
    isFetchingRef.current = true;

    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const url = `${baseUrl}/social-media/bookmarks?page=${pageNum}&limit=10`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });
      const res = await response.json();

      if (res.success) {
        if (pageNum === 1) {
          setPosts(res.data.bookmarkedPosts);
        } else {
          setPosts((prev) => [...prev, ...res.data.bookmarkedPosts]);
        }
        setHasNextPage(res.data.hasNextPage);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // --- 2. Handle Remove Bookmark (Local & API) ---
  const handleRemoveBookmark = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this post from bookmarks?')) return;

    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const response = await fetch(
        `${baseUrl}/social-media/bookmarks/${postId}`,
        {
          method: 'POST', // API uses POST to toggle, so calling it again removes it
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        }
      );
      const res = await response.json();

      if (res.success) {
        // Remove from local list immediately
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  // --- 3. Throttled Scroll for Pagination ---
  const throttle = (func, limit) => {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  const handleScroll = () => {
    const container = document.getElementById('bookmarks-container');
    if (!container) return;
    const { scrollTop, clientHeight, scrollHeight } = container;

    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingRef.current) {
        setPage((prevPage) => prevPage + 1);
      }
    }
  };

  // eslint-disable-next-line
  const throttledScroll = useCallback(throttle(handleScroll, 500), [
    hasNextPage,
  ]);

  // --- Effects ---
  useEffect(() => {
    fetchBookmarks(page);
    // eslint-disable-next-line
  }, [page]);

  useEffect(() => {
    const container = document.getElementById('bookmarks-container');
    if (container) container.addEventListener('scroll', throttledScroll);
    return () => {
      if (container) container.removeEventListener('scroll', throttledScroll);
    };
  }, [throttledScroll]);

  return (
    <div
      id="bookmarks-container"
      className="secondary-container overflow-auto w-100"
      style={{ height: 'calc(100vh - 60px)' }}
    >
      {/* Title Section */}
      <div className="bg-white p-4 rounded shadow-sm border-purple mb-5 d-flex justify-content-between align-items-center">
        <h2 className="title mb-0" style={{ color: 'var(--clr-purple)' }}>
          <i className="fa-solid fa-bookmark me-2"></i> Saved Posts
        </h2>
        <span className="badge bg-purple-light text-dark fs-6">
          {posts.length} Saved
        </span>
      </div>

      {/* Empty State */}
      {posts.length === 0 && !loading ? (
        <div className="text-center mt-5 p-5 bg-light rounded shadow-sm">
          <i
            className="fa-regular fa-bookmark mb-3 text-muted"
            style={{ fontSize: '3rem' }}
          ></i>
          <h4 className="text-muted">No bookmarks yet.</h4>
          <p>Save posts from the feed to see them here.</p>
          <button
            className="btn btn-purple-sm mt-2"
            onClick={() => navigate('/home')}
          >
            Go to Feed
          </button>
        </div>
      ) : (
        <div className="row g-4 pb-5">
          {posts.map((post) => (
            <div key={post._id} className="col-lg-4 col-md-6">
              <div
                className="card h-100 border-0 shadow-sm cursor-pointer hover-effect"
                onClick={() => navigate(`/post/${post._id}`)}
                style={{ borderRadius: '15px', transition: 'transform 0.2s' }}
              >
                {/* Header */}
                <div className="card-header bg-white border-0 d-flex align-items-center pt-3 px-3">
                  <div
                    className="profile-image"
                    style={{
                      width: '35px',
                      height: '35px',
                      marginRight: '10px',
                    }}
                  >
                    <img
                      src={
                        post.author?.account?.avatar?.url ||
                        'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                      }
                      alt="avatar"
                      style={{ width: '100%', height: '100%' }}
                      onError={(e) => {
                        e.target.onerror = null; // Prevents looping if the fallback also fails
                        // Use UI Avatars to generate an image based on their username
                        e.target.src = `https://ui-avatars.com/api/?name=${post.author?.account?.username || 'User'}&background=random`;
                        // OR use a static local image:
                        // e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                      }}
                    />
                  </div>
                  <div
                    className="d-flex flex-column"
                    style={{ lineHeight: '1.2' }}
                  >
                    <span className="fw-bold text-dark">
                      {post.author?.account?.username}
                    </span>
                    <small
                      className="text-muted"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {post.author?.location || 'Unknown'}
                    </small>
                  </div>
                </div>

                {/* Image */}
                <div
                  style={{
                    height: '250px',
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa',
                  }}
                  className="mt-2 position-relative"
                >
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0].url}
                      alt="post"
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 px-3 text-center">
                      <p className="text-muted small">
                        {post.content.substring(0, 100)}...
                      </p>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex gap-3">
                      <small className="text-muted">
                        <i className="fa-regular fa-heart me-1"></i>{' '}
                        {post.likes}
                      </small>
                      <small className="text-muted">
                        <i className="fa-regular fa-comment me-1"></i>{' '}
                        {post.comments}
                      </small>
                    </div>
                    {/* Remove Bookmark Button */}
                    <i
                      className="fa-solid fa-bookmark text-danger"
                      onClick={(e) => handleRemoveBookmark(e, post._id)}
                      title="Remove from bookmarks"
                      style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                    ></i>
                  </div>

                  <p
                    className="card-text text-secondary mb-2"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.9rem',
                    }}
                  >
                    {post.content}
                  </p>

                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="badge bg-purple-light text-dark fw-normal"
                        style={{ fontSize: '0.7rem' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary"></div>
        </div>
      )}
      {!hasNextPage && posts.length > 0 && (
        <div className="text-center text-muted small py-3">
          End of bookmarks
        </div>
      )}
    </div>
  );
};

export default BookmarkedPosts;
