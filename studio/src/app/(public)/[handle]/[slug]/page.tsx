import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Landing } from '@/components/landing/Landing';
import { loadPublicLanding } from '@/lib/landing.server';

/**
 * La página de venta pública.
 *
 * Se sirve desde el servidor a propósito: media razón de ser de esta superficie
 * es que el enlace se comparta bien y que Google la encuentre, y eso no ocurre
 * con una página que se pinta después de cargar.
 *
 * No lleva el armazón del panel —vive fuera de `(studio)`— porque quien llega
 * aquí viene a mirar un curso, no a gestionar nada.
 */

type Params = Promise<{ handle: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle, slug } = await params;
  const page = await loadPublicLanding(handle, slug);

  if (!page) return { title: 'Curso no encontrado' };

  const description = page.landing.promise || page.course.summary || undefined;

  return {
    title: `${page.course.title} · ${page.course.authorName}`,
    description,
    openGraph: {
      title: page.course.title,
      description,
      type: 'website',
    },
  };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { handle, slug } = await params;
  const page = await loadPublicLanding(handle, slug);

  if (!page) notFound();

  return <Landing landing={page.landing} course={page.course} />;
}
