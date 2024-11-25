'use client';

import { useEffect, useState } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import Loading from '@/components/Loading';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const formSchema = z.object({
  event_title: z.string().min(1, {
    message: 'Event name must be at least 1 characters.',
  }),
  event_date: z.date({
    required_error: 'A date for this event is required.',
  }),
});

const AddEvent: React.FC = () => {
  const router = useRouter();
  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isConnected) {
    }
    setIsLoading(false);
  }, [isConnected, router]);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);

      const { data: admins, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress);

      if (error) {
        setError(error);
        console.error('Error fetching events:', error);
      } else {
        if (admins[0]) setCurrentAdminId(admins[0].id);
      }

      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_title: '',
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(formData: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    setIsLoading(true);

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          event_date: formData.event_date,
          event_title: formData.event_title,
          admin_id: currentAdminId,
        },
      ])
      .select();

    if (error) {
      setError(error);
      console.error('Error saving to database:', error);
      throw new Error('Failed to save to database');
    }

    if (data) {
      router.push('/');
    }
  }

  if (error) {
    return <div>Error creating event</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected) {
    return (
      <main className='container mx-auto'>
        <div className='min-h-screen w-full flex items-center justify-center p-4 relative'>
          <ProfilePopover />
        </div>
      </main>
    );
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='w-full flex items-center justify-between relative mb-10'>
        <h1 className='text-3xl font-bold'>Add New Event</h1>
        <div className='flex items-center gap-4'>
          {isConnected && (
            <Link
              href='/'
              className='flex items-center justify-center rounded-md text-sm text-white bg-gray-500 py-2 px-6'
            >
              Return Home
            </Link>
          )}

          <ProfilePopover />
        </div>
      </div>

      <div className='w-96 m-auto mb-10'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-8 m-auto'
          >
            <FormField
              control={form.control}
              name='event_title'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Happy Birthday Sui' {...field} />
                  </FormControl>
                  <FormDescription>
                    What event are you creating?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='event_date'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Date of Event</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    On what date is this event taking place?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit'>Create Event</Button>
          </form>
        </Form>
      </div>
    </main>
  );
};
export default AddEvent;
