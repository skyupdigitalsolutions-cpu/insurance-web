import type { ReactNode } from 'react';
import { PageHeader } from './PageHeader';

// Shared layout for legal pages. The text is a starting draft to be reviewed by a lawyer before launch.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} intro={`Last updated ${updated}`} />
      <section className="bg-white py-16">
        <div className="prose-legal mx-auto max-w-[1240px] px-5 sm:px-8">{children}</div>
      </section>
    </>
  );
}
