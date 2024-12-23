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
  };

  return (
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
            onClick={takePhoto}
            disabled={!isCameraOn}
            variant='secondary'
          >
            <Camera className='mr-2 h-4 w-4' />
            Take Photo
          </Button>
          <Button onClick={resetApp} variant='outline'>
            <RotateCcw className='mr-2 h-4 w-4' />
            Reset
          </Button>
        </div>
        <div className='relative aspect-video bg-black rounded-lg overflow-hidden'>
          <video
            ref={videoRef}
            autoPlay
            hidden={!isCameraOn}
            className='w-full h-full object-cover'
          />
          {!isCameraOn && (
            <div className='absolute inset-0 flex items-center justify-center'>
              <span className='text-zinc-600 text-lg'>Camera Preview</span>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className='hidden' />
        {photoURL && (
          <div className='space-y-4'>
            <div className='relative aspect-video bg-zinc-900 rounded-lg overflow-hidden'>
              <Image
                src={photoURL}
                alt='Captured'
                fill
                className='object-contain'
              />
            </div>
            <div className='flex justify-between gap-2'>
              <Button onClick={downloadImage} variant='outline' size='sm'>
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
                size='sm'
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
          </div>
        )}
        {uploadResult && (
          <div className='mt-2 text-sm text-zinc-400'>
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
      <div className='bg-zinc-900 text-zinc-400 text-center py-2 text-sm font-bold tracking-wider'>
        {selectedEventTitle}
      </div>
    </div>
  );
};

export default PhotoBooth;
