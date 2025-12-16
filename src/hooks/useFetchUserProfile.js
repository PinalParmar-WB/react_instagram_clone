import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { setUserProfile } from '../store/authSlice';

const useFetchUserProfile = () => {
  const dispatch = useDispatch();
  const token = useSelector((store) => store.auth.accessToken);

  // 1. Get the current profile from Redux
  const userProfile = useSelector((store) => store.auth.userProfile);

  const getUserProfile = async () => {
    // Safety check: If no token, don't try to fetch
    if (!token) return;

    const url = process.env.REACT_APP_BASE_URL + '/social-media/profile';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + token,
      },
    };

    try {
      const response = await fetch(url, options);
      // Check if response is ok before parsing
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      dispatch(setUserProfile(data.data));
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (!userProfile && token) {
      getUserProfile();
    }
  }, [userProfile, token]); // Add proper dependencies
};

export default useFetchUserProfile;
