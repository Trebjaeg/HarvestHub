import dynamic from 'next/dynamic';
import { FC, ReactNode } from 'react';

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const NoSSR: FC<NoSSRProps> = ({ children, fallback = null }) => {
  return <>{children}</>;
};

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
});
