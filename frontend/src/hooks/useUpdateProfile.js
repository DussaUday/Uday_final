import { useState } from 'react';
import axios from 'axios';

const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);

  const updateProfile = async ({ fullName, profilePic }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      if (profilePic) {
        formData.append('profilePic', profilePic);
      }

      const response = await axios.put('/api/users/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, updateProfile };
};

export default useUpdateProfile;
