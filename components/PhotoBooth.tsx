'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Download,
  Upload,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import JSConfetti from 'js-confetti';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Props {
  selectedEventId: number;
  selectedEventTitle: string;
}

const PhotoBooth: React.FC<Props> = ({
  selectedEventTitle,
  selectedEventId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(false);
  const jsConfettiRef = useRef<JSConfetti | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    blobId: string;
    objectId: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const takePhotoSequence = async () => {
    setIsCapturing(true);
    setShowModal(false);
    setUploadResult(null);

    const newPhotos: string[] = [];
  
    // take four photos
    for (let i = 0; i < 4; ++i) {
      // count down for each photo
      for (let count = 3; count >= 0; --count) {
        setCountdown(count);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
  
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const photoData = canvas.toDataURL('image/png');
          newPhotos.push(photoData);
        }
      }
  
      if (i < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  
    // generate final photo strip
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && newPhotos.length === 4) {
        const singleWidth = videoRef.current?.videoWidth || 640;
        const singleHeight = videoRef.current?.videoHeight || 480;
        const padding = 20;
        const borderWidth = 40;
  
        canvas.width = singleWidth + borderWidth * 2;
        canvas.height = singleHeight * 4 + padding * 3 + borderWidth * 2;
  
        // fill with white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
  
        // load and draw images
        const images = await Promise.all(
          newPhotos.map(
            (photo) =>
              new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.src = photo;
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
              })
          )
        );
  
        images.forEach((img, index) => {
          const x = borderWidth;
          const y = borderWidth + index * (singleHeight + padding);
          context.drawImage(img, x, y, singleWidth, singleHeight);
        });
  
        // add text
        context.font = '20px';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(selectedEventTitle, canvas.width / 2, 25);
  
        const date = new Date().toLocaleDateString();
        context.fillText(date, canvas.width / 2, canvas.height - 10);
  
        const finalPhotoURL = canvas.toDataURL('image/png');
        setPhotoURL(finalPhotoURL);
        setShowModal(true);
      }
    }
  
    setIsCapturing(false);
    setCountdown(null);
  
    if (jsConfettiRef.current) {
      jsConfettiRef.current.addConfetti({
        emojis: ['📷'],
        emojiSize: 100,
        confettiNumber: 24,
      });
    }
  };

  const downloadImage = async () => {
    if (!canvasRef.current || !photoURL) return;

    const link = document.createElement('a');
    link.href = photoURL;
    link.download = 'image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadFeedback(true);
    setTimeout(() => setDownloadFeedback(false), 2000);
  };

  const uploadPhoto = async () => {
    if (!canvasRef.current) return;
    setIsUploading(true);

    try {
      const imageDataUrl = canvasRef.current.toDataURL('image/png');
      const blob = await fetch(imageDataUrl).then((res) => res.blob());

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      });

      if (!response.ok) {
        console.error('Failed to upload image:', response.statusText);
        return;
      }

      const result = await response.json();

      if (result?.data?.newlyCreated?.blobObject) {
        // save to supabase
        const { error } = await supabase.from('photos').insert([
          {
            blob_id: result.data.newlyCreated.blobObject.blobId,
            object_id: result.data.newlyCreated.blobObject.id,
            created_at: new Date().toISOString(),
            event_id: selectedEventId,
          },
        ]);

        if (error) {
          console.error('Error saving to Supabase:', error);
          throw new Error('Failed to save to database');
        }

        setUploadResult({
          blobId: result.data.newlyCreated.blobObject.blobId,
          objectId: result.data.newlyCreated.blobObject.id,
        });
      } else {
        console.error('Unexpected response structure:', result);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetApp = () => {
    if (isCameraOn) {
      stopCamera();
    }
    setPhotoURL(null);
    setUploadResult(null);
    setDownloadFeedback(false);
    setIsUploading(false);
    setIsCapturing(false);
    setCountdown(null);
  };

  return (
    <>
      <div className='max-w-md w-full bg-zinc-800 rounded-xl shadow-2xl overflow-hidden'>
        <div className='p-4 space-y-4'>
          <div className='flex space-x-2'>
            <Button
              onClick={isCameraOn ? stopCamera : startCamera}
              variant={isCameraOn ? 'destructive' : 'default'}
            >
              <Camera className='mr-2 h-4 w-4' />
              {isCameraOn ? 'Stop Camera' : 'Start Camera'}
            </Button>
            <Button
              onClick={takePhotoSequence}
              disabled={!isCameraOn || isCapturing}
              variant='secondary'
            >
              <Camera className='mr-2 h-4 w-4' />
              {isCapturing ? 'Capturing...' : 'Take Photos'}
            </Button>
            <Button onClick={resetApp} variant='outline'>
              <RotateCcw className='mr-2 h-4 w-4' />
              Reset
            </Button>
          </div>
          <div className='relative aspect-video bg-black rounded-lg overflow-hidden w-full'>
            <video
              ref={videoRef}
              autoPlay
              hidden={!isCameraOn}
              className='w-full h-full object-cover'
            />
            {!isCameraOn && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-zinc-400 text-lg'>Camera Preview</span>
              </div>
            )}
            {countdown !== null && (
              <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                <span className='text-white text-6xl font-bold'>{countdown || 'Snap!'}</span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className='hidden' />
        </div>
        <div className='bg-zinc-900 text-zinc-400 text-center py-2 text-sm font-bold tracking-wider'>
          {selectedEventTitle}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-center mb-4'>Your Photo Strip</DialogTitle>
          </DialogHeader>
          
          <div className='flex flex-col items-center gap-6'>
            {photoURL && (
              <div className='relative w-full' style={{ height: '80vh' }}>
                <Image
                  src={photoURL}
                  alt='Photo Strip'
                  fill
                  className='object-contain'
                  priority
                />
              </div>
            )}
            
            <div className='flex gap-4 w-full justify-center'>
              <Button 
                onClick={downloadImage} 
                variant='outline'
                className='w-40'
              >
                {downloadFeedback ? (
                  <Check className='mr-2 h-4 w-4 text-green-500' />
                ) : (
                  <Download className='mr-2 h-4 w-4' />
                )}
                {downloadFeedback ? 'Downloaded!' : 'Download'}
              </Button>
              
              <Button
                onClick={uploadPhoto}
                variant='outline'
                className='w-40'
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Upload className='mr-2 h-4 w-4' />
                )}
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>

            {uploadResult && (
              <div className='text-sm text-zinc-400'>
                <p>Blob ID: {uploadResult.blobId}</p>
                <p>
                  Object ID:{' '}
                  <Link
                    href={`https://suiscan.xyz/testnet/object/${uploadResult.objectId}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-400 hover:text-blue-300 underline'
                  >
                    {uploadResult.objectId}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoBooth;