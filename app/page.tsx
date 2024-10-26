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
    <div className="photo-booth">
      <div>
        <button onClick={isCameraOn ? stopCamera : startCamera}>
          {isCameraOn ? 'Stop Camera' : 'Start Camera'}
        </button>
        <button onClick={takePhoto} disabled={!isCameraOn}>
          Take Photo
        </button>
      </div>
      <video ref={videoRef} autoPlay hidden={!isCameraOn} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {photoURL && (
        <div>
          <Image src={photoURL} alt="Captured" width={300} height={300} />
          <button onClick={copyPhoto}>Copy to Clipboard</button>
          <button onClick={downloadPhoto}>Download</button>
          <button onClick={uploadPhoto}>Upload Photo</button>
        </div>
      )}
    </div>
  );
};

export default PhotoBooth;
