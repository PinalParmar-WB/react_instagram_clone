import React, { useState } from 'react';
import '../css/CreatePost.css';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); 
  const [previews, setPreviews] = useState([]); 
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = useSelector(store => store.auth.accessToken); 

  // 1. Handle Image Selection with Size Validation
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check for max 6 images limit
    if (images.length + files.length > 6) {
      alert("You can only upload a maximum of 6 images.");
      return;
    }

    // Filter out files larger than 2MB
    const validFiles = [];
    files.forEach(file => {
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > 2) {
        alert(`File "${file.name}" is too large! Please upload images smaller than 2MB.`);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    const newImages = [...images, ...validFiles];
    setImages(newImages);

    // Generate previews for valid files only
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  // 2. Remove Image Function
  const removeImage = (indexToRemove) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previews[indexToRemove]);

    setImages(images.filter((_, index) => index !== indexToRemove));
    setPreviews(previews.filter((_, index) => index !== indexToRemove));
  };

  // 3. Handle Tags
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

  // 4. API Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      images.forEach((image) => {
        formData.append('images', image);
      });

      tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/social-media/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert("Post created successfully! 🎉");
        setContent('');
        setImages([]);
        setPreviews([]);
        setTags([]);
        navigate('/profile');
      } else {
        alert(data.message || "Failed to create post. Try smaller images.");
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-purple p-5 bg-white"> 
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="title">Create New Post</h2>
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
          <label className="form-label fw-bold">Images (Max 6)</label>
          <input 
            type="file" 
            className="form-control mb-2" 
            accept="image/*" 
            multiple 
            onChange={handleImageChange}
          />
          <small className="text-muted d-block mb-2">Max file size: 2MB per image</small>
          
          {/* Previews with Remove Button */}
          {previews.length > 0 && (
            <div className="image-preview-container">
              {previews.map((src, index) => (
                <div key={index} className="preview-wrapper">
                  <img src={src} alt="preview" className="image-preview" />
                  <button 
                    type="button" 
                    className="btn-remove-img"
                    onClick={() => removeImage(index)}
                    title="Remove image"
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
            placeholder="Type a tag and press Enter..."
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
          <button 
            type="submit" 
            className="btn-purple" 
            disabled={loading}
          >
            {loading ? 'Sharing...' : 'Share Post'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-lg"
            onClick={() => navigate('/home')}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreatePost;