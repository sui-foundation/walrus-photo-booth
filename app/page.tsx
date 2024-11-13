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
        <div className='flex'>
          <div className=''>1</div>
          <div className=''>2</div>
          <div className=''>3</div>
          <div className=''>4</div>
        </div>
        <div className='flex'>
          <div className=''>5</div>
          <div className=''>6</div>
          <div className=''>7</div>
          <div className=''>8</div>
        </div>
        <div className='flex'>
          <div className=''>9</div>
          <div className=''>10</div>
          <div className=''>11</div>
          <div className=''>12</div>
        </div>
        <div className='flex'>
          <div className=''>13</div>
          <div className=''>4</div>
          <div className=''>15</div>
          <div className=''>16</div>
        </div>
      </div>
    </>
  );
};

export default PhotoBooth;
