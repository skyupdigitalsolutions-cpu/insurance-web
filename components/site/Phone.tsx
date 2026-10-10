import Image from 'next/image';

// A phone frame showing a real screen from the app (screenshots taken on the real backend)
export function Phone({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`relative aspect-[390/844] rounded-[44px] bg-[#0b1526] p-[10px] shadow-[0_50px_80px_-30px_rgba(12,27,51,.55)] ring-1 ring-black/10 ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-white">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 70vw, 320px" className="object-cover object-top" priority={priority} />
      </div>
      <div aria-hidden="true" className="absolute left-1/2 top-[18px] h-[22px] w-[90px] -translate-x-1/2 rounded-full bg-[#0b1526]" />
    </div>
  );
}
