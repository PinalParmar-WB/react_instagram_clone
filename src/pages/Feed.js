import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Feed = () => {
  const navigate = useNavigate();

  // --- States ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState("all"); // 'all', 'username', 'tag'
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for Throttling and State Access inside Event Listeners
  const isFetchingRef = useRef(false); // To prevent double calling API

  // --- Helper to get Token ---
  const token = useSelector((store) => store.auth.accessToken);

  // --- 1. The Fetch Function (Updated for Pagination) ---
  const fetchPosts = async (pageNum, isNewSearch = false) => {
    // Prevent fetching if already loading or no more pages (unless it's a new search)
    if (isFetchingRef.current) return;
    if (!isNewSearch && !hasNextPage) return;

    setLoading(true);
    isFetchingRef.current = true;

    try {
      let url = `${process.env.REACT_APP_BASE_URL}/social-media/posts?page=${pageNum}&limit=10`;

      if (filterType === "username" && searchQuery.trim()) {
        url = `${process.env.REACT_APP_BASE_URL}/social-media/posts/get/u/${searchQuery.trim()}?page=${pageNum}&limit=10`;
      } else if (filterType === "tag" && searchQuery.trim()) {
        url = `${process.env.REACT_APP_BASE_URL}/social-media/posts/get/t/${searchQuery.trim()}?page=${pageNum}&limit=10`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });
      const res = await response.json();

      if (res.success) {
        if (isNewSearch) {
          setPosts(res.data.posts); // Replace data
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]); // Append data
        }
        setHasNextPage(res.data.hasNextPage);
      } else {
        if (isNewSearch) setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // --- 2. Throttling Utility Function ---
  // This ensures 'func' is only called once every 'limit' milliseconds
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

  // --- 3. Handle Scroll Event ---
  const handleScroll = () => {
    // Check if user has scrolled to the bottom of the feed container
    const container = document.getElementById("feed-container");
    if (!container) return;

    const { scrollTop, clientHeight, scrollHeight } = container;

    // If we are within 50px of the bottom, load more
    if (scrollHeight - scrollTop <= clientHeight + 50) {
        if (hasNextPage && !isFetchingRef.current) {
            setPage((prevPage) => prevPage + 1);
        }
    }
  };

  // Create the throttled version of the scroll handler (memoized)
  // We use 500ms throttle - meaning we only check scroll position twice per second max
  // eslint-disable-next-line
  const throttledScroll = useCallback(throttle(handleScroll, 500), [hasNextPage]);

  // --- Effects ---

  // A. Trigger Fetch when Page Number Changes
  useEffect(() => {
    // If page is 1, we treat it as a new/initial fetch. 
    // If page > 1, it's an append.
    if (page === 1) {
        fetchPosts(1, true); 
    } else {
        fetchPosts(page, false);
    }
    // eslint-disable-next-line
  }, [page]);

  // B. Attach Scroll Listener
  useEffect(() => {
    const container = document.getElementById("feed-container");
    if (container) {
        container.addEventListener("scroll", throttledScroll);
    }
    return () => {
        if (container) {
            container.removeEventListener("scroll", throttledScroll);
        }
    };
  }, [throttledScroll]);


  // --- Handlers ---
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to page 1, which triggers the Effect A
    setHasNextPage(true);
  };

  const handleReset = () => {
    setFilterType("all");
    setSearchQuery("");
    setPage(1);
    setHasNextPage(true);
  };

  const navigateToDetail = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    // IMPORTANT: Added ID 'feed-container' for scroll targeting
    <div id="feed-container" className="secondary-container overflow-auto w-100" style={{height: 'calc(100vh - 60px)'}}>
      
      {/* --- Filter Section --- */}
      <div className="bg-white p-4 rounded shadow-sm border-purple mb-5">
        <h2 className="title mb-3" style={{ color: "var(--clr-purple)" }}>
          Explore Feed
        </h2>

        <form onSubmit={handleSearch} className="row g-3 align-items-center">
          <div className="col-md-3">
            <select
              className="form-select border-purple"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setSearchQuery("");
              }}
            >
              <option value="all">All Posts</option>
              <option value="username">By Username</option>
              <option value="tag">By Tag Name</option>
            </select>
          </div>

          <div className="col-md-6">
            <input
              type="text"
              className="form-control border-purple"
              placeholder={
                filterType === "username"
                  ? "Enter username..."
                  : filterType === "tag"
                  ? "Enter tag..."
                  : "Showing all posts..."
              }
              disabled={filterType === "all"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="col-md-3 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-purple-sm w-100"
              disabled={filterType !== "all" && !searchQuery.trim()}
            >
              Search
            </button>
            {filterType !== "all" && (
              <button
                type="button"
                className="btn btn-secondary w-50"
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- Posts Grid --- */}
      {posts.length === 0 && !loading ? (
        <div className="text-center mt-5 p-5 bg-light rounded">
          <h4 className="text-muted">No posts found.</h4>
          <button className="btn btn-link link" onClick={handleReset}>
            View all posts
          </button>
        </div>
      ) : (
        <div className="row g-4 pb-5">
          {posts.map((post) => (
            <div key={post._id} className="col-lg-4 col-md-6">
              <div
                className="card h-100 border-0 shadow-sm cursor-pointer hover-effect"
                onClick={() => navigateToDetail(post._id)}
                style={{
                  borderRadius: "15px",
                  transition: "transform 0.2s",
                }}
              >
                <div className="card-header bg-white border-0 d-flex align-items-center pt-3 px-3">
                  <div
                    className="profile-image"
                    style={{
                      width: "35px",
                      height: "35px",
                      marginRight: "10px",
                    }}
                  >
                    <img
                      src={
                        post.author?.account?.avatar?.url ||
                        "https://via.placeholder.com/50"
                      }
                      alt="avatar"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                  <div className="d-flex flex-column" style={{ lineHeight: "1.2" }}>
                    <span className="fw-bold text-dark">
                      {post.author?.account?.username}
                    </span>
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {post.author?.location || "Unknown location"}
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    height: "250px",
                    overflow: "hidden",
                    backgroundColor: "#f8f9fa",
                  }}
                  className="mt-2 position-relative"
                >
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0].url}
                      alt="post"
                      className="w-100 h-100"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 px-3 text-center">
                      <p className="text-muted small">
                        {post.content.substring(0, 100)}...
                      </p>
                    </div>
                  )}
                  {post.images && post.images.length > 1 && (
                    <span className="position-absolute top-0 end-0 m-2 badge bg-dark opacity-75">
                      <i className="fa-regular fa-images me-1"></i>
                      {post.images.length}
                    </span>
                  )}
                </div>

                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <div className="text-muted">
                      <i className="fa-regular fa-heart me-1"></i> {post.likes}
                    </div>
                    <div className="text-muted">
                      <i className="fa-regular fa-comment me-1"></i>{" "}
                      {post.comments}
                    </div>
                  </div>

                  <p
                    className="card-text text-secondary mb-2"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: "2",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      fontSize: "0.9rem",
                    }}
                  >
                    {post.content}
                  </p>

                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="badge bg-purple-light text-dark fw-normal"
                        style={{ fontSize: "0.7rem" }}
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

      {/* Loading Indicator at Bottom */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small">Loading more posts...</p>
        </div>
      )}
      
      {!hasNextPage && posts.length > 0 && (
         <div className="text-center py-4 text-muted">
            <small>You have reached the end.</small>
         </div>
      )}
    </div>
  );
};

export default Feed;