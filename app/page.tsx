'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const PhotoBooth: React.FC = () => {
  return (
    <>
      <div className='min-h-screen w-full flex flex-col items-center justify-center p-4 relative'>
        <h1>Photo Booth Events</h1>
        <div className='grid grid-cols-4 gap-4 p-4'>
          {Array.from({ length: 16 }).map((_, index) => (
            <div
              key={index}
              className={
                'flex items-center justify-center h-20 border rounded-lg bg-gray-100 hover:bg-gray-200'
              }
            >
              <span className='text-lg font-semibold'>{`Event ${
                index + 1
              }`}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PhotoBooth;
