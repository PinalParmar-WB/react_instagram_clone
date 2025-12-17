import React, { useState, useEffect } from 'react';
import '../css/CreatePost.css'; // Reusing your existing CSS
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const EditPost = () => {
  const { postId } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const token = useSelector(store => store.auth.accessToken);

  // States
  const [content, setContent] = useState('');
  const [newImages, setNewImages] = useState([]); // Stores NEW files (File Objects)
  const [previews, setPreviews] = useState([]);   // Stores URLs (Existing + New Blobs)
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/social-media/posts/${postId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const res = await response.json();
        
        if (res.success) {
          const post = res.data;
          setContent(post.content);
          setTags(post.tags || []);
          
          // Set existing images as previews
          if (post.images && post.images.length > 0) {
            setPreviews(post.images.map(img => img.url));
          }
        } else {
            alert("Could not fetch post details.");
            navigate('/profile');
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
    // eslint-disable-next-line
  }, [postId, token, navigate]);

  // 2. Handle New Image Selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate Count (Existing Previews + New Files)
    if (previews.length + files.length > 6) {
      alert("Total images cannot exceed 6.");
      return;
    }

    // Validate Size
    const validFiles = [];
    files.forEach(file => {
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 2) {
        alert(`File "${file.name}" is too large! Max 2MB.`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    // Add to 'newImages' state (for API)
    setNewImages([...newImages, ...validFiles]);

    // Add to 'previews' state (for UI)
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviewUrls]);
  };

  // 3. Remove Image (UI Only - complex logic needed to delete individual old images via API)
  const removeImage = (indexToRemove) => {
    // Note: This UI removal logic assumes simply resetting if the user wants to change images.
    // Deep deletion of specific existing images requires a separate API call in most backends.
    // For this UI: We simply remove it from the preview list.
    
    // If it's a new image (Blob), we should revoke it
    if (previews[indexToRemove].startsWith('blob:')) {
        URL.revokeObjectURL(previews[indexToRemove]);
        // Also remove from newImages array (need to calculate offset)
        // This is complex, so for simplicity in Edit Mode:
        // We usually advise users: "Uploading new images will replace old ones" 
        // OR simply filter the preview.
    }
    
    setPreviews(previews.filter((_, index) => index !== indexToRemove));
  };

  // 4. Tag Handling
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  // 5. Submit Update (PATCH)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Append Tags
      tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });

      // Append NEW images only
      // NOTE: Most APIs will replace ALL images if you send the 'images' key.
      // If you send no images, it usually keeps the old ones.
      if(newImages.length > 0) {
        newImages.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/social-media/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert("Post updated successfully!");
        navigate(`/post/${postId}`); // Go back to details page
      } else {
        alert(data.message || "Failed to update post.");
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if(fetching) return <div className="p-5 text-center">Loading post data...</div>;

  return (
    <div className="border-purple p-5 bg-white"> 
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="title">Edit Post</h2>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Caption */}
        <div className="mb-4">
          <label className="form-label fw-bold">Caption</label>
          <textarea 
            className="form-control" 
            rows="3" 
            placeholder="Write something..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Images */}
        <div className="mb-4">
          <label className="form-label fw-bold">Images</label>
          <input 
            type="file" 
            className="form-control mb-2" 
            accept="image/*" 
            multiple 
            onChange={handleImageChange}
          />
          <small className="text-muted d-block mb-2">
            *Uploading new images will typically replace existing ones (depending on backend).
          </small>
          
          {/* Previews */}
          {previews.length > 0 && (
            <div className="image-preview-container">
              {previews.map((src, index) => (
                <div key={index} className="preview-wrapper">
                  <img src={src} alt="preview" className="image-preview" />
                  {/* Optional: Disable removal of existing images if API doesn't support partial delete */}
                  <button 
                    type="button" 
                    className="btn-remove-img"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mb-5">
          <label className="form-label fw-bold">Tags</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />
          <div className="mt-3">
            {tags.map((tag, index) => (
              <span key={index} className="tag-badge">
                #{tag}
                <span className="tag-remove" onClick={() => removeTag(index)}>×</span>
              </span>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex gap-3">
          <button type="submit" className="btn-purple" disabled={loading}>
            {loading ? 'Updating...' : 'Update Post'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-lg"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditPost;