'use client'

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Camera, Copy, Download, Upload, Check } from "lucide-react";
import JSConfetti from 'js-confetti';

const PhotoBooth: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(false);

  const jsConfettiRef = useRef<JSConfetti | null>(null);

  useEffect(() => {
    jsConfettiRef.current = new JSConfetti();
    return () => {
      jsConfettiRef.current = null;
    };
  }, []);

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
    if (jsConfettiRef.current) {
      jsConfettiRef.current.addConfetti({
        emojis: ['📷'],
        emojiSize: 100,
        confettiNumber: 24,
      });
    }
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
      try {
        const response = await fetch(photoURL);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      } catch (err) {
        console.error('Error copying image:', err);
      }
    }
  };

  const downloadPhoto = () => {
    if (photoURL) {
      const a = document.createElement('a');
      a.href = photoURL;
      a.download = 'photo.png';
      a.click();
      setDownloadFeedback(true);
      setTimeout(() => setDownloadFeedback(false), 2000);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 space-y-4">
          <div className="flex space-x-2">
            <Button
              onClick={isCameraOn ? stopCamera : startCamera}
              variant={isCameraOn ? "destructive" : "default"}
            >
              <Camera className="mr-2 h-4 w-4" />
              {isCameraOn ? 'Stop Camera' : 'Start Camera'}
            </Button>
            <Button
              onClick={takePhoto}
              disabled={!isCameraOn}
              variant="secondary"
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
          </div>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              hidden={!isCameraOn}
              className="w-full h-full object-cover"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-zinc-600 text-lg">Camera Preview</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          {photoURL && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
                <Image
                  src={photoURL}
                  alt="Captured"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button onClick={copyPhoto} variant="outline" size="sm">
                  {copyFeedback ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copyFeedback ? "Copied!" : "Copy"}
                </Button>
                <Button onClick={downloadPhoto} variant="outline" size="sm">
                  {downloadFeedback ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {downloadFeedback ? "Downloaded!" : "Download"}
                </Button>
                <Button onClick={uploadPhoto} variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="bg-zinc-900 text-zinc-400 text-center py-2 text-sm font-bold tracking-wider">
          photo booth
        </div>
      </div>
    </div>
  );
};

export default PhotoBooth;
