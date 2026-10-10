import { AdvisorDay } from '@/components/site/AdvisorDay';
import { Capabilities } from '@/components/site/Capabilities';
import { Closing } from '@/components/site/Closing';
import { Faq } from '@/components/site/Faq';
import { Hero } from '@/components/site/Hero';
import { Pricing } from '@/components/site/Pricing';
import { Story } from '@/components/site/Story';
import { Trust } from '@/components/site/Trust';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Story />
      <AdvisorDay />
      <Capabilities />
      <Trust />
      <Pricing />
      <Faq />
      <Closing />
    </>
  );
}
