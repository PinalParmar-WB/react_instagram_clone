import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Following = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const userProfile = useSelector((store) => store.auth.user);
  const token = useSelector((store) => store.auth.accessToken);
  const isFetchingRef = useRef(false);
  const navigate = useNavigate();

  const fetchFollowing = async (pageNum) => {
    if (isFetchingRef.current || !userProfile?.username) return;
    if (pageNum > 1 && !hasNextPage) return;

    setLoading(true);
    isFetchingRef.current = true;

    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const url = `${baseUrl}/social-media/follow/list/following/${userProfile.username}?page=${pageNum}&limit=10`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });
      const res = await response.json();

      if (res.success) {
        if (pageNum === 1) setUsers(res.data.following);
        else setUsers((prev) => [...prev, ...res.data.following]);

        setHasNextPage(res.data.hasNextPage);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const response = await fetch(`${baseUrl}/social-media/follow/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
        },
      });
      const res = await response.json();

      if (res.success) {
        // Update local state to reflect the follow/unfollow status immediately
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, isFollowing: res.data.following } : u
          )
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

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
    const container = document.getElementById('following-container');
    if (!container) return;
    const { scrollTop, clientHeight, scrollHeight } = container;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingRef.current) setPage((p) => p + 1);
    }
  };

  const throttledScroll = useCallback(throttle(handleScroll, 500), [
    hasNextPage,
  ]);

  useEffect(() => {
    fetchFollowing(page);
  }, [page]);

  useEffect(() => {
    const container = document.getElementById('following-container');
    if (container) container.addEventListener('scroll', throttledScroll);
    return () => {
      if (container) container.removeEventListener('scroll', throttledScroll);
    };
  }, [throttledScroll]);

  return (
    <div
      id="following-container"
      className="secondary-container overflow-auto w-100"
      style={{ height: 'calc(100vh - 60px)' }}
    >
      <button
        className="btn mb-3 p-0 link fw-bold"
        onClick={() => navigate(-1)}
      >
        <i className="fa-solid fa-arrow-left me-2"></i> Back to Profile
      </button>
      <div className="bg-white p-4 rounded shadow-sm border-purple mb-4 d-flex justify-content-between align-items-center">
        <h2 className="title mb-0" style={{ color: 'var(--clr-purple)' }}>
          People I Follow
        </h2>
        {/* FIX: Calculate count based on who is currently 'isFollowing: true' */}
        <span className="badge bg-purple-light text-dark">
          {users.filter((u) => u.isFollowing).length} Users
        </span>
      </div>

      <div className="row g-4 pb-5">
        {users.map((user) => (
          <div key={user._id} className="col-lg-4 col-md-6">
            <div
              className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3"
              style={{ borderRadius: '15px' }}
            >
              <div
                className="profile-image"
                style={{ width: '60px', height: '60px' }}
              >
                <img
                  src={
                    user.avatar?.url ||
                    'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                  }
                  alt="p"
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  onError={(e) => {
                    e.target.onerror = null; // Prevents looping if the fallback also fails
                    // Use UI Avatars to generate an image based on their username
                    e.target.src = `https://ui-avatars.com/api/?name=${user.username || 'User'}&background=random`;
                    // OR use a static local image:
                    // e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-0 fw-bold">{user.username}</h6>
                <small
                  className="text-muted d-block text-truncate"
                  style={{ maxWidth: '150px' }}
                >
                  {user.email}
                </small>
              </div>
              <button
                className={`btn btn-sm ${user.isFollowing ? 'btn-outline-secondary' : 'btn-purple-sm'}`}
                onClick={() => handleFollowToggle(user._id)}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border text-primary"></div>
        </div>
      )}
      {!hasNextPage && users.length > 0 && (
        <div className="text-center text-muted small">No more following</div>
      )}
    </div>
  );
};

export default Following;
