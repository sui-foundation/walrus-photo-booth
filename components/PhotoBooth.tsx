'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Check, Loader2 } from 'lucide-react';
import JSConfetti from 'js-confetti';
import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import QRCode from 'react-qr-code';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Props {
  selectedEventId: number;
  selectedEventTitle: string;
  selectedEventSlug: string;
  selectedTuskyId: string | null;
}

const PhotoBooth: React.FC<Props> = ({
  selectedEventTitle,
  selectedEventSlug,
  selectedEventId,
  selectedTuskyId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const jsConfettiRef = useRef<JSConfetti | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const baseUrl = 'https://cdn.tusky.io/';
  // const eventUrl = `${baseUrl}/events/${selectedEventSlug}`;

  useEffect(() => {
    jsConfettiRef.current = new JSConfetti();
    return () => {
      jsConfettiRef.current = null;
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showModal) {
      timer = setTimeout(() => {
        setShowModal(false);
      }, 45000); // 45 seconds
    }
    return () => clearTimeout(timer);
  }, [showModal]);

  const startCamera = async () => {
    setIsCameraOn(true); // Only set state, do not call getUserMedia here
  };

  // When isCameraOn=true and videoRef has mounted, then call getUserMedia
  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          // Optionally: handle error, show message
          console.error('Error accessing camera:', err);
        });
    }
  }, [isCameraOn, videoRef.current]);

  const takePhotoSequence = async () => {
    setIsCapturing(true);
    setShowModal(false);
    setIsUploaded(false);
    setIsUploading(false);

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
        const videoElement = videoRef.current;

        if (context) {
          const { videoWidth, videoHeight } = videoElement;

          canvas.width = videoWidth;
          canvas.height = videoHeight;

          context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
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
        const { videoWidth, videoHeight } = videoRef.current!;
        const singleWidth = videoWidth;
        const singleHeight = videoHeight;
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

        // get the font family from CSS variable
        const fontFamily = getComputedStyle(document.documentElement)
          .getPropertyValue('--font-mondwest-reg')
          .trim();

        // add text
        context.font = `20px ${fontFamily}`;
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(selectedEventTitle, canvas.width / 2, 25);

        context.fillText(
          'Reliably Yours 💜 Walrus',
          canvas.width / 2,
          canvas.height - 20
        );

        const finalPhotoURL = canvas.toDataURL('image/png');
        setPhotoURL(finalPhotoURL);
        setShowModal(true);
        await uploadPhoto();
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
          'TuskyID': selectedTuskyId ? selectedTuskyId.toString() : '',
        },
        body: blob,
      });

      if (!response.ok) {
        console.error('Failed to upload image:', response.statusText);
        return;
      }

      const result = await response.json();

      if (result?.data.uploadId) {
        // save to supabase
        const { data, error } = await supabase.from('photos').insert([
          {
            // blob_id: blobId,
            // object_id: objectId,
            created_at: new Date().toISOString(),
            event_id: selectedEventId,
            tusky_id: result.data.uploadId,
          },
        ]).select();

        if (error) {
          console.error('Error saving to Supabase:', error);
          throw new Error('Failed to save to database');
        }

        if (data && data.length > 0) {
          setPhotoId(data[0].tusky_id);
        }

        setIsUploaded(true);
      } else {
        console.error('Unexpected response structure:', result);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setIsUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  const qrCodeValue = photoId
    ? `${baseUrl}${photoId}`
    : photoURL || '';

  return (
    <div className="w-full min-h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Header */}
      <div className="w-full bg-black text-white px-8 pt-4 pb-1 border-b border-white/10">
        <div className="text-lg font-neuemontreal font-normal opacity-80">
          Walrus Photo Booth
        </div>
        <div
          className="text-5xl font-bold font-neuebit tracking-wider"
          style={{ letterSpacing: 2 }}
        >
          {selectedEventTitle?.toUpperCase()}
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#232323] relative py-2">
        {/* If camera is not turned on, show waiting message */}
        {!isCameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white text-2xl font-neuemontreal">
              Awaiting Camera Activation
            </span>
          </div>
        )}
        {/* If camera is on, show video and capture button */}
        {isCameraOn && (
          <>
            <div className="w-full max-w-2xl flex flex-col items-center justify-center">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden w-full shadow-xl border border-zinc-700">
                <video
                  ref={videoRef}
                  autoPlay
                  className="w-full h-full object-contain"
                />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <span className="text-white text-8xl font-bold font-neuebit animate-pulse">
                      {countdown || 'Snap!'}
                    </span>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </>
        )}
      </div>
      {/* Footer/Active Camera Bar */}
      <div className="w-full border-t border-black">
        {!isCameraOn ? (
          <button
            onClick={startCamera}
            className="w-full py-4 text-xl font-mono font-bold bg-cyan-200 text-black tracking-widest focus:outline-none active:opacity-90 transition-all duration-200"
            style={{ borderRadius: 0, border: 'none' }}
          >
            ACTIVATE CAMERA
          </button>
        ) : (
          <button
            onClick={takePhotoSequence}
            disabled={isCapturing}
            className={`w-full py-4 text-xl font-mono font-bold bg-cyan-200 text-black tracking-widest focus:outline-none active:opacity-90 transition-all duration-200${isCapturing ? ' opacity-60 cursor-not-allowed' : ''}`}
            style={{ borderRadius: 0, border: 'none' }}
          >
            {isCapturing ? 'CAPTURING...' : 'TAKE PHOTOS'}
          </button>
        )}
      </div>
      {/* Modal giữ nguyên */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className='max-w-md bg-black/90 border-zinc-700 h-[90vh] flex flex-col items-center justify-start p-4'>
          <DialogHeader className='w-full'>
            <DialogTitle className='text-center text-2xl font-semibold mb-2 text-white w-full'>
              Your Photo Strip
            </DialogTitle>
            <DialogClose
              className='absolute top-4 right-4 z-50 
                        bg-black/60 hover:bg-black/80
                        w-8 h-8
                        flex items-center justify-center
                        shadow-lg transition-all 
                        hover:scale-110 focus:outline-none'
              aria-label='Close dialog'
            >
              <span className='text-white text-xl leading-none font-semibold'>
                ×
              </span>
            </DialogClose>
          </DialogHeader>
          <div className='flex-1 w-full flex flex-col items-center justify-start min-h-0 mt-2'>
            {photoURL && (
              <div className='flex flex-col items-center w-full'>
                <div className='relative bg-white rounded-lg border border-zinc-300 p-2 mx-auto' style={{ width: '260px', minHeight: '390px', maxWidth: '90vw', maxHeight: '50vh' }}>
                  <Image
                    src={photoURL}
                    alt='Photo Strip'
                    fill
                    className='object-contain rounded-lg'
                    priority
                  />
                </div>
              </div>
            )}
            {isUploading && (
              <div className='w-full flex flex-col items-center justify-center mt-6'>
                <span className='text-white text-base mb-4'>Uploading your photo strip...</span>
                <div className='bg-zinc-800 rounded-lg flex items-center justify-center' style={{ width: 90, height: 90 }}>
                  <Image src='/3_icon_walrus_white_RGB 1.png' alt='Uploading mascot' width={60} height={60} className='object-contain max-w-[60px] max-h-[60px]'/>
                </div>
              </div>
            )}
            {isUploaded && (
              <div className='flex flex-col items-center gap-2 mt-6 w-full'>
                <span className='text-white text-lg font-semibold mb-1 text-center font-neuemontreal'>Scan QR code to view your photo</span>
                <span className='text-cyan-200 text-xs mb-2 text-center font-neuemontreal'>Return to Take Photo Mode in 45 second(s)...</span>
                <div className='bg-white p-2 rounded-lg shadow-lg flex items-center justify-center' style={{maxWidth: 120, maxHeight: 120}}>
                  <QRCode
                    value={qrCodeValue}
                    size={100}
                    style={{height: 'auto', maxWidth: '100px', width: '100%'}}
                    viewBox={`0 0 256 256`}
                    className='rounded'
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoBooth;
