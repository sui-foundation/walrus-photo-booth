'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { ExternalLink } from 'lucide-react';

export default function ProfilePopover() {
  const { isConnected, logout, redirectToAuthUrl, emailAddress, address } =
    useCustomWallet();

  if (isConnected) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div>
            <Button className='hidden sm:block' variant={'secondary'}>
              {emailAddress}
            </Button>
            <Avatar className='block sm:hidden'>
              <AvatarImage src='https://github.com/shadcn.png' />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Card className='border-none shadow-none'>
            {/* <Button variant={'ghost'} size='icon' className="relative top-0 right-0" onClick={getAccountInfo}><RefreshCw width={16} /></Button> */}
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
              <CardDescription>
                View the account generated by Enoki&apos;s zkLogin flow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <>
                <div className='flex flex-row gap-1 items-center'>
                  <span>Address: </span>
                  <div className='flex flex-row gap-1'>
                    <span>{`${address?.slice(0, 5)}...${address?.slice(
                      63
                    )}`}</span>
                    <a
                      href={`https://suiscan.xyz/testnet/account/${address}`}
                      target='_blank'
                    >
                      <ExternalLink width={12} />
                    </a>
                  </div>
                </div>
              </>
            </CardContent>
            <CardFooter className='flex flex-row gap-2 items-center justify-between'>
              <Button
                variant={'destructive'}
                size={'sm'}
                className='w-full text-center'
                onClick={logout}
              >
                Logout
              </Button>
            </CardFooter>
          </Card>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button
      variant={'secondary'}
      onClick={() => {
        redirectToAuthUrl();
      }}
    >
       Sign In
    </Button>
  );
}
