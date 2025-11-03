import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - HarvestHub',
  description: 'Learn about HarvestHub\'s mission to bridge farmers and buyers through digital innovation. Meet our team and discover our story of empowering agricultural communities.',
  keywords: 'HarvestHub, about us, team, farmers, buyers, agriculture, Philippines, fresh produce, sustainable farming',
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}