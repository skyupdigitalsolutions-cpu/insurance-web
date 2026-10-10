import { ButtonLink } from './Button';

export function Closing() {
  return (
    <section className="relative overflow-hidden bg-blue py-24 text-white">
      <svg aria-hidden="true" viewBox="0 0 600 600" className="absolute -right-24 -top-24 h-[520px] w-[520px] opacity-20">
        <circle cx="300" cy="300" r="260" fill="none" stroke="#fff" strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={300 + Math.cos(a) * 260} cy={300 + Math.sin(a) * 260} r={i === 2 ? 12 : 5} fill={i === 2 ? '#f2a93b' : '#fff'} />;
        })}
      </svg>
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <h2 className="headline max-w-[18ch] text-[clamp(2.2rem,4.6vw,3.8rem)]">Your next renewal is already on the calendar.</h2>
        <p className="mt-5 max-w-[48ch] text-[18px] text-white/85">Bring your leads and policies in today. The reminders start working tonight.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/signup" variant="white">Start your 14-day free trial</ButtonLink>
          <ButtonLink href="/contact" variant="ghost-light">Talk to us</ButtonLink>
        </div>
      </div>
    </section>
  );
}
