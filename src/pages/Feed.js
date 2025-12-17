import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Feed = () => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.auth.user);
  const token = useSelector((store) => store.auth.accessToken);

  // --- States ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // This Set will store the Profile IDs of everyone the user follows
  const [followingSet, setFollowingSet] = useState(new Set());
  
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isFetchingRef = useRef(false);

  // 1. Fetch the User's Following List (To know who we are following)
  // We fetch this ONCE when the component mounts.
  const fetchFollowingList = async () => {
    if (!user?.username) return;
    
    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      // Fetching page 1 with a larger limit to get most followings
      // (In a real massive app, you'd handle pagination for this list too)
      const url = `${baseUrl}/social-media/follow/list/following/${user.username}?page=1&limit=100`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      const res = await response.json();

      if (res.success) {
        // Extract the PROFILE IDs from the following list
        // based on your JSON: item.profile._id is the ID we need to match with post.author._id
        const ids = new Set(res.data.following.map(item => item.profile._id));
        setFollowingSet(ids);
      }
    } catch (error) {
      console.error("Error fetching following list:", error);
    }
  };

  // 2. Fetch Posts
  const fetchPosts = async (pageNum, isNewSearch = false, typeOverride = null, queryOverride = null) => {
    if (isFetchingRef.current) return;
    if (!isNewSearch && !hasNextPage) return;

    setLoading(true);
    isFetchingRef.current = true;

    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const currentFilterType = typeOverride !== null ? typeOverride : filterType;
      const currentSearchQuery = queryOverride !== null ? queryOverride : searchQuery;

      let url = `${baseUrl}/social-media/posts?page=${pageNum}&limit=10`;

      if (currentFilterType === "username" && currentSearchQuery.trim()) {
        url = `${baseUrl}/social-media/posts/get/u/${currentSearchQuery.trim()}?page=${pageNum}&limit=10`;
      } else if (currentFilterType === "tag" && currentSearchQuery.trim()) {
        url = `${baseUrl}/social-media/posts/get/t/${currentSearchQuery.trim()}?page=${pageNum}&limit=10`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      const res = await response.json();

      if (res.success) {
        const newPosts = res.data.posts; // We keep posts raw, we calculate following status in Render

        if (isNewSearch) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
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

  // 3. Handle Follow / Unfollow
  const handleFollowToggle = async (e, authorProfileId, authorAccountId) => {
    e.stopPropagation();
    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      // Usually API requires the Account ID to follow
      const response = await fetch(`${baseUrl}/social-media/follow/${authorAccountId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      const res = await response.json();

      if (res.success) {
        const isNowFollowing = res.data.following; // true or false
        
        // Update our local Set of IDs immediately
        setFollowingSet(prevSet => {
            const newSet = new Set(prevSet);
            if (isNowFollowing) {
                newSet.add(authorProfileId); // Add Profile ID
            } else {
                newSet.delete(authorProfileId); // Remove Profile ID
            }
            return newSet;
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  // --- Handle Bookmark ---
  const handleBookmark = async (e, postId) => {
    e.stopPropagation();
    try {
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const response = await fetch(`${baseUrl}/social-media/bookmarks/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      });
      const res = await response.json();

      if (res.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, isBookmarked: res.data.isBookmarked } : post
          )
        );
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
    }
  };

  // --- Effects ---
  
  // Initial Load: Fetch Following List FIRST, then Posts
  useEffect(() => {
    fetchFollowingList();
    // eslint-disable-next-line
  }, []); // Run once on mount

  // Pagination Logic
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
    const container = document.getElementById("feed-container");
    if (!container) return;
    const { scrollTop, clientHeight, scrollHeight } = container;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasNextPage && !isFetchingRef.current) {
        setPage((prevPage) => prevPage + 1);
      }
    }
  };

  const throttledScroll = useCallback(throttle(handleScroll, 500), [hasNextPage]);

  useEffect(() => {
    if (page === 1) fetchPosts(1, true);
    else fetchPosts(page, false);
    // eslint-disable-next-line
  }, [page]);

  useEffect(() => {
    const container = document.getElementById("feed-container");
    if (container) container.addEventListener("scroll", throttledScroll);
    return () => {
      if (container) container.removeEventListener("scroll", throttledScroll);
    };
  }, [throttledScroll]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts(1, true);
    setPage(1);
    setHasNextPage(true);
  };

  const handleReset = () => {
    setFilterType("all");
    setSearchQuery("");
    setPage(1);
    setHasNextPage(true);
    fetchPosts(1, true, "all", "");
  };

  return (
    <div id="feed-container" className="secondary-container overflow-auto w-100" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Filter Section */}
      <div className="bg-white p-4 rounded shadow-sm border-purple mb-5">
        <h2 className="title mb-3" style={{ color: "var(--clr-purple)" }}>Explore Feed</h2>
        <form onSubmit={handleSearch} className="row g-3 align-items-center">
          <div className="col-md-3">
            <select className="form-select border-purple" value={filterType} onChange={(e) => { setFilterType(e.target.value); setSearchQuery(""); }}>
              <option value="all">All Posts</option>
              <option value="username">By Username</option>
              <option value="tag">By Tag Name</option>
            </select>
          </div>
          <div className="col-md-6">
            <input type="text" className="form-control border-purple" placeholder={filterType === "username" ? "Enter username..." : filterType === "tag" ? "Enter tag..." : "Showing all posts..."} disabled={filterType === "all"} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-purple-sm w-100" disabled={filterType !== "all" && !searchQuery.trim()}>Search</button>
            {filterType !== "all" && (<button type="button" className="btn btn-secondary w-50" onClick={handleReset}>Reset</button>)}
          </div>
        </form>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 && !loading ? (
        <div className="text-center mt-5 p-5 bg-light rounded">
          <h4 className="text-muted">No posts found.</h4>
        </div>
      ) : (
        <div className="row g-4 pb-5">
          {posts.map((post) => {
            // LOGIC: Check if this post's author ID is in our 'followingSet'
            // We use post.author._id (Profile ID) because that matches the following list data
            const isFollowing = followingSet.has(post.author?._id);
            const isOwnPost = user?._id === post.author?.account?._id;

            return (
              <div key={post._id} className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-sm cursor-pointer hover-effect" onClick={() => navigate(`/post/${post._id}`)} style={{ borderRadius: "15px", transition: "transform 0.2s" }}>
                  
                  {/* Header */}
                  <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 px-3">
                    <div className="d-flex align-items-center">
                      <div className="profile-image" style={{ width: "35px", height: "35px", marginRight: "10px" }}>
                          <img src={post.author?.account?.avatar?.url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                      </div>
                      <div className="d-flex flex-column" style={{ lineHeight: "1.2" }}>
                          <span className="fw-bold text-dark">{post.author?.account?.username}</span>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>{post.author?.location || "Unknown"}</small>
                      </div>
                    </div>
                    
                    {/* BUTTON LOGIC */}
                    {!isOwnPost && (
                       <button 
                          className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-purple-sm'} px-3`}
                          style={{fontSize: '0.8rem', paddingBlock: '4px'}}
                          // We pass Profile ID (for local update) AND Account ID (for API call)
                          onClick={(e) => handleFollowToggle(e, post.author?._id, post.author?.account?._id)}
                       >
                          {isFollowing ? 'Following' : 'Follow'}
                       </button>
                    )}
                  </div>

                  {/* Image */}
                  <div style={{ height: "250px", overflow: "hidden", backgroundColor: "#f8f9fa" }} className="mt-2 position-relative">
                    {post.images && post.images.length > 0 ? (
                      <img src={post.images[0].url} alt="post" className="w-100 h-100" style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 px-3 text-center"><p className="text-muted small">{post.content.substring(0, 100)}...</p></div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex gap-3">
                          <small className="text-muted"><i className="fa-regular fa-heart me-1"></i> {post.likes}</small>
                          <small className="text-muted"><i className="fa-regular fa-comment me-1"></i> {post.comments}</small>
                      </div>
                      <i className={`fa-bookmark ${post.isBookmarked ? 'fa-solid' : 'fa-regular'}`} onClick={(e) => handleBookmark(e, post._id)} style={{cursor: 'pointer', fontSize: '1.2rem', color: post.isBookmarked ? 'var(--clr-purple)' : '#6c757d'}}></i>
                    </div>
                    <p className="card-text text-secondary mb-2" style={{ display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: "0.9rem" }}>{post.content}</p>
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {post.tags && post.tags.slice(0, 3).map((tag, i) => (<span key={i} className="badge bg-purple-light text-dark fw-normal" style={{ fontSize: "0.7rem" }}>#{tag}</span>))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {loading && <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>}
    </div>
  );
};

export default Feed;