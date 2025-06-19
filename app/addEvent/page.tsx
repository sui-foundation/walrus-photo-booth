'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z, ZodType } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Input } from '@/components/ui/input';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import Loading from '@/components/Loading';

const tuskyVaultID = process.env.NEXT_PUBLIC_TUSKY_VAULT_ID || '';

const timezones = [
  { value: '-12:00', name: '(GMT -12:00) International Date Line West' },
  { value: '-11:00', name: '(GMT -11:00) Midway Island, Samoa' },
  { value: '-10:00', name: '(GMT -10:00) Hawaii' },
  { value: '-09:00', name: '(GMT -9:00) Alaska' },
  { value: '-08:00', name: '(GMT -8:00) Pacific Time (US & Canada)' },
  { value: '-07:00', name: '(GMT -7:00) Mountain Time (US & Canada)' },
  {
    value: '-06:00',
    name: '(GMT -6:00) Central Time (US & Canada), Mexico City',
  },
  {
    value: '-05:00',
    name: '(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima',
  },
  {
    value: '-04:00',
    name: '(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz',
  },
  { value: '-03:30', name: '(GMT -3:30) Newfoundland' },
  { value: '-03:00', name: '(GMT -3:00) Brazil, Buenos Aires, Georgetown' },
  { value: '-02:00', name: '(GMT -2:00) Mid-Atlantic' },
  { value: '-01:00', name: '(GMT -1:00) Azores, Cape Verde Islands' },
  { value: '+00:00', name: '(GMT) Western Europe Time, London, Lisbon, Casablanca' },
  { value: '+01:00', name: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris' },
  { value: '+02:00', name: '(GMT +2:00) Kaliningrad, South Africa' },
  { value: '+03:00', name: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg' },
  { value: '+03:30', name: '(GMT +3:30) Tehran' },
  { value: '+04:00', name: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi' },
  { value: '+04:30', name: '(GMT +4:30) Kabul' },
  { value: '+05:00', name: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent' },
  { value: '+05:30', name: '(GMT +5:30) Bombay, Calcutta, Madras, New Delhi' },
  { value: '+05:45', name: '(GMT +5:45) Kathmandu' },
  { value: '+06:00', name: '(GMT +6:00) Almaty, Dhaka, Colombo' },
  { value: '+06:30', name: '(GMT +6:30) Yangon, Cocos Islands' },
  { value: '+07:00', name: '(GMT +7:00) Bangkok, Hanoi, Jakarta' },
  { value: '+08:00', name: '(GMT +8:00) Beijing, Perth, Singapore, Hong Kong' },
  { value: '+09:00', name: '(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk' },
  { value: '+09:30', name: '(GMT +9:30) Adelaide, Darwin' },
  { value: '+10:00', name: '(GMT +10:00) Eastern Australia, Guam, Vladivostok' },
  { value: '+11:00', name: '(GMT +11:00) Magadan, Solomon Islands, New Caledonia' },
  { value: '+12:00', name: '(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka' },
];
// Then use this array to populate your select element
const hours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
const mins = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')) as [string, ...string[]];

type FormData = {
  eventTitle: string;
  eventSlug: string;
  eventDate: Date;
  eventTimeHour: string;
  eventTimeMin: string;
  eventTimeAMPM: string;
  eventTimezone: string;
};

const EventSchema: ZodType<FormData> = z.object({
  eventTitle: z
    .string({ required_error: 'Please enter an event name.' })
    .min(1, {
      message: 'Event name must be at least 1 character.',
    })
    .regex(/^[a-zA-Z0-9\s&@.,_\-'"]+$/, {
      message:
        'Input must contain only letters, numbers, spaces, &, @, ., _, or -, single quotes, or double quotes',
    })
    .trim()
    .toLowerCase(),
  eventSlug: z
    .string({ required_error: 'Please enter slug for the event url.' })
    .min(1, {
      message: 'Event slug must be at least 1 character.',
    })
    .regex(/^[a-zA-Z0-9\-]+$/, {
      message: 'Input must contain only letters, numbers, or -',
    })
    .trim()
    .toLowerCase(),
  eventDate: z.date({
    required_error: 'A date for this event is required.',
  }),
  eventTimeHour: z.enum(hours, {
    message: 'A time for this event is required.',
  }),
  eventTimeMin: z.enum(mins, {
    message: 'A time for this event is required.',
  }),
  eventTimeAMPM: z.enum(['AM', 'PM'], {
    message: 'Please select AM or PM.',
  }),
  eventTimezone: z.string({
    required_error: 'The timezone for this event is required.',
  }),
});

const AddEvent: React.FC = () => {
  const router = useRouter();
  const { isConnected, emailAddress } = useCustomWallet();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventSlugManuallyEdited, setEventSlugManuallyEdited] = useState(false);
  const [hideDateTime, setHideDateTime] = useState(true); // always true for now

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);

      const { data: admins, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress);

      if (error) {
        setError(error);
        console.error('Error fetching admin:', error);
      } else {
        if (admins.length > 0) {
          setCurrentAdminId(admins[0].id);
        } else {
          setCurrentAdminId(0);
        }
      }

      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let hourIn12 = currentHour % 12;
  hourIn12 = hourIn12 === 0 ? 12 : hourIn12;
  const ampm = currentHour >= 12 ? 'PM' : 'AM';

  const minuteString = currentMinute.toString().padStart(2, '0');

  const getTimezoneOffset = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(offsetInMinutes / 60);
    const formattedOffset = `${offsetInMinutes <= 0 ? '+' : '-'}${Math.floor(offsetHours)
      .toString()
      .padStart(2, '0')}:00`;
    return formattedOffset;
  };

  // 1. Define your form.
  const form = useForm<z.infer<typeof EventSchema>>({
    resolver: zodResolver(EventSchema),
    defaultValues: {
      eventTitle: '',
      eventSlug: '',
      eventDate: now, // set to current date
      eventTimeHour: hourIn12.toString(),
      eventTimeMin: minuteString,
      eventTimeAMPM: ampm,
      eventTimezone: getTimezoneOffset(), // set to current timezone
    },
  });

  // Auto-generate slug from title unless user edits slug manually
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'eventTitle' && !eventSlugManuallyEdited) {
        const eventTitle = values.eventTitle ?? '';
        const slug = eventTitle
          .normalize('NFD') // chuyển về dạng có thể loại bỏ dấu
          .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '') // chỉ giữ lại ký tự a-z, 0-9, khoảng trắng, gạch ngang
          .replace(/\s+/g, '-') // thay khoảng trắng bằng gạch ngang
          .replace(/-+/g, '-'); // loại bỏ gạch ngang thừa
        form.setValue('eventSlug', slug, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, eventSlugManuallyEdited]);

  // 2. Define a submit handler.
  async function onSubmit(formData: z.infer<typeof EventSchema>) {
    setIsSubmitting(true);

    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    // setIsLoading(true);

    let hr;

    if (formData.eventTimeAMPM === 'PM') {
      hr = parseInt(formData.eventTimeHour) === 12 ? 12 : parseInt(formData.eventTimeHour) + 12;
    } else {
      hr = parseInt(formData.eventTimeHour) === 12 ? 0 : parseInt(formData.eventTimeHour);
    }

    const formattedTime = `${hr.toString().padStart(2, '0')}:${formData.eventTimeMin}:00`;

    const date = new Date(formData.eventDate);

    const day = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const dateNum = date.getDate();
    const year = date.getFullYear();

    const formattedDate = `${day} ${month} ${dateNum} ${year} ${formattedTime} ${formData.eventTimezone}`;

    setError(null);
    setErrorMessage(null);

    // Create a unique event ID by combining title, date and admin ID
    const sanitizedTitle = formData.eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Format date to YYYYMMDD
    const dateForId = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

    // Create event ID with random suffix for uniqueness
    const eventId = `${sanitizedTitle}-${dateForId}-${currentAdminId}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create folder in Tusky with this ID
    const tuskyResponse = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: eventId,
        vaultId: tuskyVaultID,
      })
    });

    if (!tuskyResponse.ok) {
      const errorData = await tuskyResponse.json();
      console.error('Error creating Tusky folder:', errorData);
      setError(new Error('Failed to create folder in Tusky'));
      setErrorMessage('There was an error creating the event folder. Please try again.');
      return;
    }

    const tuskyFolder = await tuskyResponse.json();

    const tuskyFolderId = tuskyFolder.data.id;

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          event_title: formData.eventTitle,
          admin_id: currentAdminId,
          event_date: formattedDate,
          event_slug: formData.eventSlug,
          tusky_id: tuskyFolderId
        },
      ])
      .select();

    if (error) {
      setError(error);
      console.error('Error saving to database:', error);
      if (error.code === '23505') {
        setErrorMessage('Slug already taken, please enter a new slug.');
      } else {
        setErrorMessage(
          'There was an error saving your event, please reload the page and try again!'
        );
      }
    }

    if (data) {
      router.push('/');
    }
    setIsSubmitting(false);
  }

  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_BASE_URL || '';

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected) {
    return (
      <main className='container mx-auto'>
        <div className='min-h-screen w-full flex items-center justify-center p-4 relative'>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <div className="w-full bg-black text-white flex flex-col border-b border-white/10">
        <div className="flex items-center px-2 py-2 gap-2">
          <button onClick={() => router.back()} className="p-2 rounded hover:bg-white/10 flex items-center">
            <ArrowLeft className="w-6 h-6" />
            <span className="ml-1 text-base">Back</span>
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-4xl font-neuebit tracking-widest" style={{ letterSpacing: 2 }}>ADD NEW EVENT</span>
          </div>
          <div className="flex items-center gap-3 min-w-[48px]">
           <img src="/on.png" alt="Logo" width={40} height={40} className="rounded-full hover:opacity-80 transition cursor-pointer ml-2" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-start items-stretch px-0 pt-6 pb-32">
        <div className="w-full max-w-lg mx-auto">
          {error && <p className='text-red-500'>{errorMessage}</p>}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name='eventTitle'
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg font-neuebit mb-2">Event Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='Happy Birthday Sui'
                        className="text-lg px-2 border border-gray-300 rounded bg-white shadow-sm focus:ring-2 focus:ring-teal-200 focus:outline-none font-neuemontreal"
                        style={{fontFamily: 'monospace'}}
                        {...field}
                        onChange={e => {
                          field.onChange(e);
                          setEventSlugManuallyEdited(false);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='eventSlug'
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-lg font-neuebit mb-2">Event Slug <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='happy-birthday-sui'
                        className="text-lg px-2 border border-gray-300 rounded bg-white shadow-sm focus:ring-2 focus:ring-teal-200 focus:outline-none font-neuemontreal"
                        style={{fontFamily: 'monospace'}}
                        {...field}
                        onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                        onChange={e => {
                          field.onChange(e);
                          setEventSlugManuallyEdited(true);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Hide Date & Time and Time Zone fields */}
              {/* <FormField name='eventDate' ... /> */}
              {/* <div className="flex gap-4"> ... </div> */}
              {/* <FormField name='eventTimezone' ... /> */}
              {/* Show current date, time, and timezone as info */}
              <div className="flex flex-col gap-2">
                <div className="text-base font-mono text-gray-700">
                  <span>Event date & time: </span>
                  <span>{format(now, 'EEE MMM d yyyy HH:mm')} (GMT{getTimezoneOffset()})</span>
                </div>
              </div>
              <div className="h-32" /> {/* Spacer for fixed button */}
            </form>
          </Form>
        </div>
      </div>
      {/* Fixed bottom button */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center gap-3">
            <span className="text-lg font-mono font-semibold">Creating event...</span>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-400" />
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-teal-200" style={{ zIndex: 50 }}>
        <button
          type="submit"
          onClick={() => form.handleSubmit(onSubmit)()}
          className="w-full py-5 text-lg font-semibold tracking-wider text-black bg-teal-200 hover:bg-teal-300 transition rounded-none font-mono"
          style={{fontFamily: 'monospace'}}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'CREATE NEW EVENT'}
        </button>
      </div>
    </main>
  );
};
export default AddEvent;
