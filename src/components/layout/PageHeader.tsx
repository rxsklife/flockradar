import Reveal from '@/components/Reveal';

export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- static bg art */}
      <img
        src="/hero.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-30"
        width={2048}
        height={1152}
        draggable={false}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/45 to-navy-950"
      />
      <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-8 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow eyebrow-term justify-center mono-data">{'// '}{eyebrow}</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-steel-100 sm:text-4xl">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-4 text-lg leading-8 text-steel-300">{description}</p>
        </Reveal>
      </div>
      <div aria-hidden="true" className="relative h-[2px] overflow-hidden border-b border-navy-700/80">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-radar-400/70 to-transparent" />
      </div>
    </section>
  );
}
