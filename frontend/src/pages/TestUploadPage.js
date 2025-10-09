import React, { useState } from 'react';
import axios from 'axios';

const TestUploadPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      console.log('📤 Uploading to:', `${API}/upload-images`);

      const response = await axios.post(`${API}/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        setUploadedImages(prev => [...prev, ...response.data.images]);
        console.log('✅ Upload success:', response.data.images);
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Upload error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Image Upload</h1>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          className="mb-4"
        />
        {isUploading && <div className="text-blue-600">Uploading...</div>}
      </div>

      <div className="mb-4">
        <strong>Backend URL:</strong> {process.env.REACT_APP_BACKEND_URL}
      </div>

      {uploadedImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Uploaded Images ({uploadedImages.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {uploadedImages.map((img, index) => (
              <div key={index} className="border rounded">
                <img 
                  src={img.url}
                  alt={img.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 text-sm">
                  <div><strong>File:</strong> {img.name}</div>
                  <div><strong>Size:</strong> {Math.round(img.size / 1024)}KB</div>
                  <div><strong>Type:</strong> Base64 Data URL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestUploadPage;