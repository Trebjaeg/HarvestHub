import KaliHelpCenterWidget from '@/components/KaliHelpCenterWidget';

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <KaliHelpCenterWidget />
    </>
  );
}
