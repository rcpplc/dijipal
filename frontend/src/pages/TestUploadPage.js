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
        setUploadedImages(prev => [...prev, ...response.data.files]);
        console.log('✅ Upload success:', response.data.files);
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
                  src={`${process.env.REACT_APP_BACKEND_URL}${img.url}`}
                  alt={img.filename}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    console.error('Image load error for:', img.url);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBFcnJvcjwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <div className="p-2 text-sm">
                  <div><strong>File:</strong> {img.filename}</div>
                  <div><strong>URL:</strong> {img.url}</div>
                  <div><strong>Size:</strong> {Math.round(img.size / 1024)}KB</div>
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