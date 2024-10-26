'use client'

import React, { useRef, useState } from 'react';
import Image from 'next/image';

const PhotoBooth: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = async () => {
    if (videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setPhotoURL(canvas.toDataURL('image/png'));
      }
    }
  };

  const copyPhoto = async () => {
    if (photoURL) {
      const response = await fetch(photoURL);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      alert('Image copied to clipboard!');
    }
  };

  const downloadPhoto = () => {
    if (photoURL) {
      const a = document.createElement('a');
      a.href = photoURL;
      a.download = 'photo.png';
      a.click();
    }
  };

  const uploadPhoto = async () => {
    if (!canvasRef.current) return;
    
    const imageDataUrl = canvasRef.current.toDataURL('image/png');
    try {
      const blob = await fetch(imageDataUrl).then(res => res.blob());
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      });
      if (!response.ok) {
        console.error('Failed to upload image:', response.statusText);
      } else {
        const result = await response.json();
        console.log('Image uploaded successfully', result);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4 space-x-2">
        <button
          onClick={isCameraOn ? stopCamera : startCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {isCameraOn ? 'Stop Camera' : 'Start Camera'}
        </button>
        <button
          onClick={takePhoto}
          disabled={!isCameraOn}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Take Photo
        </button>
      </div>
      <video
        ref={videoRef}
        autoPlay
        hidden={!isCameraOn}
        className="w-full h-auto mb-4 rounded"
      />
      <canvas ref={canvasRef} className="hidden" />
      {photoURL && (
        <div className="space-y-4">
          <Image
            src={photoURL}
            alt="Captured"
            width={300}
            height={300}
            className="w-full h-auto rounded"
          />
          <div className="flex justify-between">
            <button
              onClick={copyPhoto}
              className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={downloadPhoto}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Download
            </button>
            <button
              onClick={uploadPhoto}
              className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
            >
              Upload Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoBooth;
