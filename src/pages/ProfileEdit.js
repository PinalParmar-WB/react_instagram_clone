import React, { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setUserProfile, setUser } from '../store/authSlice';
import useFetchUserProfile from '../hooks/useFetchUserProfile';

const ProfileEdit = () => {
  const dispatch = useDispatch();
  const navi = useNavigate();
  const firstName = useRef();
  const lastName = useRef();
  const dob = useRef();
  const location = useRef();
  const phoneNumber = useRef();
  const countryCode = useRef();
  const bio = useRef();
  const token = useSelector((store) => store.auth.accessToken);
  const userProfile = useSelector((store) => store.auth.userProfile);
  // Ref for the file input
  const fileInputRef = useRef();
  const user = useSelector((store) => store.auth.user);

  // --- STATE CHANGES ---
  // 1. Store the actual file object here to upload later
  const [selectedFile, setSelectedFile] = useState(null);
  // 2. Preview state
  const [preview, setPreview] = useState(user?.avatar?.url || "/images/default-avatar.png");

  // 1. Function to trigger the hidden file input
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  // 2. Function to handle file selection, Preview, and Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Generate Preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Store file in state for the Submit button to use
    setSelectedFile(file);
  };

  // --- HELPER: UPLOAD AVATAR ---
  // This function now returns TRUE if success, FALSE if failed
  const uploadAvatarApi = async (fileToUpload) => {
    const formData = new FormData();
    formData.append("avatar", fileToUpload);

    const url = process.env.REACT_APP_BASE_URL + "/users/avatar";

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
          accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();
      
      if(data.success) {
          // Update Redux/Local Storage immediately so sidebar updates
          const updatedUser = { ...user, avatar: data.data.avatar };
          localStorage.setItem("user", JSON.stringify(updatedUser)); 
          dispatch(setUser({ user: updatedUser, accessToken: localStorage.getItem("accessToken") }));
          return true; // Success
      } else {
          return false; // Failed
      }
    } catch (error) {
      console.error("Avatar update failed:", error);
      return false; // Error
    }
  };

  const handleSubmit = async () => {
    // ---------------------------------------------------------
    // FIX START: Capture values BEFORE awaiting the image upload
    // ---------------------------------------------------------
    const fNameVal = firstName.current.value;
    const lNameVal = lastName.current.value;
    const bioVal = bio.current.value;
    const dobVal = dob.current.value;
    const locationVal = location.current.value;
    const phoneVal = phoneNumber.current.value;
    const codeVal = countryCode.current.value;

    // STEP 1: Upload Image (This causes a re-render/dispatch)
    if (selectedFile) {
        const imageSuccess = await uploadAvatarApi(selectedFile);
        if (!imageSuccess) {
            alert("Failed to upload profile image. Cancelling update.");
            return; 
        }
    }
    
    // STEP 2: Use the VARIABLES captured above, NOT the refs
    const url = process.env.REACT_APP_BASE_URL + '/social-media/profile';
    const options = {
      method: 'PATCH',
      headers: {accept: 'application/json', 'content-type': 'application/json', 'Authorization': `Bearer ${token}`},
      body: JSON.stringify({
        firstName: fNameVal, // Use variable
        lastName: lNameVal,  // Use variable
        bio: bioVal,         // Use variable
        dob: dobVal,         // Use variable
        location: locationVal, // Use variable
        phoneNumber: phoneVal, // Use variable
        countryCode: codeVal,  // Use variable
      })
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      // --- ERROR HANDLING LOGIC START ---
      if (!data.success) {
        // 1. Check if the 'errors' array exists and has items
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            
            // Map through the array to get the message strings.
            // Since the error object is { phoneNumber: "msg" }, we use Object.values(obj)[0]
            const errorMessages = data.errors.map(errObj => Object.values(errObj)[0]);
            
            // Join them with a new line (\n) for the alert box
            alert(errorMessages.join('\n'));
        } 
        // 2. Fallback if there are no specific field errors, but a main message exists
        else if (data.message) {
            alert(data.message);
        }
        return; // Stop execution here so we don't proceed to success logic
      }
      // --- ERROR HANDLING LOGIC END ---

      dispatch(setUserProfile(data.data));
      // Success Logic
      alert("Profile updated successfully!");
      navi("/profile");
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <>
        <div className="fs-3 text-center mt-4 mb-4 fw-semibold">
            Edit Profile
        </div>
        <div className="w-50 p-5 mx-auto d-block border-purple">
            {/* --- PROFILE IMAGE SECTION START --- */}
            <div className="d-flex justify-content-center mb-4">
              <div className="position-relative">
                {/* The Image */}
                <img 
                  src={preview} 
                  alt="profile preview" 
                  className="rounded-circle border border-2 border-primary object-fit-cover"
                  style={{ width: "120px", height: "120px", cursor: "pointer" }}
                  onClick={handleImageClick}
                  title="Click to change image"
                />
                
                {/* Optional: Small Camera Icon Overlay */}
                <div 
                    className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm border"
                    style={{cursor: "pointer"}}
                    onClick={handleImageClick}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="black" className="bi bi-camera-fill" viewBox="0 0 16 16">
                        <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                        <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0"/>
                    </svg>
                </div>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            {/* --- PROFILE IMAGE SECTION END --- */}
            
            <form className="w-100" onSubmit={(e) => e.preventDefault()}>
                <div className="row">
                  <div className="col">
                    <label className="form-label fw-bold">First name : </label>
                    <input type="text" defaultValue={userProfile.firstName} ref={firstName} className="form-control" placeholder="First name" aria-label="First name" required/>
                  </div>
                  <div className="col">
                    <label className="form-label fw-bold">Last name : </label>
                    <input type="text" defaultValue={userProfile.lastName} ref={lastName} className="form-control" placeholder="Last name" aria-label="Last name" required/>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col">
                    <label className="form-label fw-bold">Country code : </label>
                    <input type="text" defaultValue={userProfile.countryCode} ref={countryCode} className="form-control" placeholder="Country code" aria-label="Country code" required/>
                  </div>
                  <div className="col">
                    <label className="form-label fw-bold">Phone number : </label>
                    <input type="number" defaultValue={userProfile.phoneNumber} ref={phoneNumber} className="form-control" placeholder="Phone number" aria-label="Phone number" required/>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col">
                    <label className="form-label fw-bold">Location : </label>
                    <input type="text" defaultValue={userProfile.location} ref={location} className="form-control" placeholder="Location" aria-label="Location" required/>
                  </div>
                  <div className="col">
                    <label className="form-label fw-bold">Date of Birth : </label>
                    <input type="date" defaultValue={userProfile?.dob ? userProfile.dob.split('T')[0] : ''}  ref={dob} className="form-control" placeholder="Date of Birth" aria-label="Date of Birth" required/>
                  </div>
                </div>
                <div className="mb-3 mt-3">
                  <label className="form-label fw-bold">Bio : </label>
                  <input type="text" defaultValue={userProfile.bio} ref={bio} className="form-control" placeholder="Enter Bio" required/>
                </div>
                <button onClick={handleSubmit} className="btn-purple-sm mt-4 me-4">Edit</button>
                <Link to='/profile'><button className="btn-purple-sm mt-4">Back</button></Link>
            </form>
        </div>
    </>
  )
}

export default ProfileEdit