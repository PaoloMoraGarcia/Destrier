import type { CSSProperties } from 'react';

import { formatMoney } from '@/lib/format';
import type { Block, CourseData, Landing as LandingData } from '@/lib/landing';
import { THEMES } from '@/lib/landing';

/**
 * La página de venta.
 *
 * **Este componente es la página pública y a la vez la vista previa del editor.**
 * No hay dos versiones. Cualquier imitación se separa de la realidad al segundo
 * cambio, y entonces "lo que ves es lo que se publica" pasa a ser mentira.
 *
 * De Skool se toma la forma: una columna, se lee de arriba abajo, termina en el
 * botón, sin menú ni pestañas. Lo que no se toma es su motor —puntos, niveles y
 * tablas de clasificación— ni su prueba social: aquí no hay número de alumnos ni
 * valoraciones. La prueba es que una lección se ve entera y gratis.
 */
export function Landing({ landing, course }: { landing: LandingData; course: CourseData }) {
  const theme = THEMES[landing.theme] ?? THEMES.papel;

  return (
    <article
      style={
        {
          ...theme.vars,
          background: 'var(--l-canvas)',
          color: 'var(--l-ink)',
        } as CSSProperties
      }
      className="min-h-full w-full">
      {landing.blocks.map((block, index) => (
        <BlockView
          key={`${block.type}-${index}`}
          block={block}
          landing={landing}
          course={course}
        />
      ))}
      <Footer />
    </article>
  );
}

function BlockView({
  block,
  landing,
  course,
}: {
  block: Block;
  landing: LandingData;
  course: CourseData;
}) {
  switch (block.type) {
    case 'hero':
      return <Hero landing={landing} course={course} />;
    case 'preview':
      return <Preview course={course} />;
    case 'outcomes':
      return <Outcomes items={block.items} />;
    case 'syllabus':
      return <Syllabus course={course} />;
    case 'author':
      return <Author course={course} />;
    case 'faq':
      return <Faq items={block.items} />;
    case 'quote':
      return <Quote text={block.text} author={block.author} />;
    case 'closing':
      return <Closing landing={landing} course={course} />;
  }
}

// ---------------------------------------------------------------------------
// Piezas compartidas
// ---------------------------------------------------------------------------

/** El ancho de lectura es el mismo en todos los bloques: es lo que da ritmo. */
function Section({
  children,
  label,
  className = '',
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-2xl px-6 py-14 ${className}`}>
      {label && (
        <p
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--l-soft)' }}>
          {label}
        </p>
      )}
      {children}
    </section>
  );
}

function Cta({ label, price }: { label: string; price?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span
        className="inline-flex items-center rounded-full px-7 py-3.5 text-[15px] font-semibold"
        style={{ background: 'var(--l-accent)', color: 'var(--l-on-accent)' }}>
        {label}
      </span>
      {price && (
        <span className="font-mono text-sm" style={{ color: 'var(--l-soft)' }}>
          {price}
        </span>
      )}
    </div>
  );
}

/**
 * La línea que separa dos elementos de una lista.
 *
 * Va explícita y no con `divide-y` de Tailwind: esa utilidad solo pone el grosor
 * y deja el color en `currentColor`, que aquí es la tinta. Sobre papel salía una
 * raya negra demasiado dura, y en el tema Tinta habría sido negra sobre negro —
 * es decir, ninguna raya. El color del filo es del tema, así que se pide.
 */
function divider(index: number, total: number): CSSProperties | undefined {
  if (index === total - 1) return undefined;
  return { borderBottom: '1px solid var(--l-line)' };
}

function priceLabel(course: CourseData): string {
  return course.priceCents === null
    ? 'Gratis'
    : `${formatMoney(course.priceCents, course.currency)} · pago único`;
}

// ---------------------------------------------------------------------------
// Los bloques
// ---------------------------------------------------------------------------

function Hero({ landing, course }: { landing: LandingData; course: CourseData }) {
  return (
    <header className="mx-auto w-full max-w-2xl px-6 pb-14 pt-16">
      <div
        className="mb-10 aspect-[16/9] w-full overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--l-line)', background: 'var(--l-surface)' }}>
        {course.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--l-soft)' }}>
            sin portada
          </div>
        )}
      </div>

      <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
        {course.title}
      </h1>

      {landing.promise && (
        <p className="mt-5 text-lg leading-relaxed" style={{ color: 'var(--l-soft)' }}>
          {landing.promise}
        </p>
      )}

      <div className="mt-9">
        <Cta label={landing.ctaLabel} price={priceLabel(course)} />
      </div>
    </header>
  );
}

/**
 * La lección gratis.
 *
 * Es el bloque que sustituye a las cifras de alumnos, y por eso va arriba: la
 * decisión de comprar se toma mirando una lección de verdad, no leyendo cuánta
 * gente compró antes.
 */
function Preview({ course }: { course: CourseData }) {
  const lesson = course.lessons.find((item) => item.isPreview);

  return (
    <Section label="Míralo antes de pagar">
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--l-line)', background: 'var(--l-surface)' }}>
        <div
          className="flex aspect-video items-center justify-center"
          style={{ background: 'var(--l-canvas)' }}>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'var(--l-accent)', color: 'var(--l-on-accent)' }}>
            <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden>
              <path d="M0 0 L18 10 L0 20 Z" fill="currentColor" />
            </svg>
          </span>
        </div>
        <div className="px-6 py-5">
          <p className="text-base font-medium">
            {lesson?.title ?? 'Elige una lección de muestra en tu curso'}
          </p>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--l-soft)' }}>
            Lección completa, sin cuenta y sin pagar.
          </p>
        </div>
      </div>
    </Section>
  );
}

function Outcomes({ items }: { items: string[] }) {
  const written = items.filter((item) => item.trim().length > 0);
  if (written.length === 0) return null;

  return (
    <Section label="Lo que vas a saber">
      <ul className="space-y-4">
        {written.map((item, index) => (
          <li key={index} className="flex gap-4">
            <span
              className="mt-0.5 font-mono text-sm tabular-nums"
              style={{ color: 'var(--l-accent)' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-lg leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * El temario sale de `course_items`, no se escribe.
 *
 * El creador ya montó y ordenó sus lecciones; pedirle que las vuelva a teclear
 * aquí garantiza que las dos listas acaben diciendo cosas distintas.
 */
function Syllabus({ course }: { course: CourseData }) {
  if (course.lessons.length === 0) return null;

  return (
    <Section label={`Temario · ${course.lessons.length} lecciones`}>
      <ol>
        {course.lessons.map((lesson, index) => (
          <li
            key={index}
            className="flex items-center gap-4 py-4"
            style={divider(index, course.lessons.length)}>
            <span
              className="font-mono text-xs tabular-nums"
              style={{ color: 'var(--l-soft)' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex-1 text-base leading-snug">{lesson.title}</span>
            {lesson.isPreview && (
              <span
                className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                style={{ background: 'var(--l-accent)', color: 'var(--l-on-accent)' }}>
                gratis
              </span>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Author({ course }: { course: CourseData }) {
  return (
    <Section label="Quién lo enseña">
      <div className="flex items-start gap-5">
        <div
          className="h-14 w-14 shrink-0 overflow-hidden rounded-full border"
          style={{ borderColor: 'var(--l-line)', background: 'var(--l-surface)' }}>
          {course.authorAvatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="flex items-center gap-2 text-lg font-medium">
            {course.authorName || 'Tu nombre'}
            {course.isVerified && (
              <span
                className="font-mono text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--l-accent)' }}>
                verificado
              </span>
            )}
          </p>
          {course.authorBio && (
            <p className="mt-2 leading-relaxed" style={{ color: 'var(--l-soft)' }}>
              {course.authorBio}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const written = items.filter((item) => item.q.trim().length > 0);
  if (written.length === 0) return null;

  return (
    <Section label="Preguntas">
      <dl>
        {written.map((item, index) => (
          <div key={index} className="py-5" style={divider(index, written.length)}>
            <dt className="text-base font-medium">{item.q}</dt>
            <dd className="mt-2 leading-relaxed" style={{ color: 'var(--l-soft)' }}>
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** Un testimonio en texto. Sin foto y sin estrellas: no es una puntuación. */
function Quote({ text, author }: { text: string; author: string }) {
  if (!text.trim()) return null;

  return (
    <Section>
      <blockquote
        className="border-l-2 pl-6"
        style={{ borderColor: 'var(--l-accent)' }}>
        <p className="text-2xl leading-snug">{text}</p>
        {author && (
          <footer className="mt-4 font-mono text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--l-soft)' }}>
            {author}
          </footer>
        )}
      </blockquote>
    </Section>
  );
}

function Closing({ landing, course }: { landing: LandingData; course: CourseData }) {
  return (
    <Section className="!py-16">
      <div
        className="rounded-2xl border px-8 py-10"
        style={{ borderColor: 'var(--l-line)', background: 'var(--l-surface)' }}>
        <p className="text-2xl font-semibold leading-tight">{course.title}</p>
        {course.summary && (
          <p className="mt-3 leading-relaxed" style={{ color: 'var(--l-soft)' }}>
            {course.summary}
          </p>
        )}
        <div className="mt-8">
          <Cta label={landing.ctaLabel} price={priceLabel(course)} />
        </div>
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer
      className="mx-auto w-full max-w-2xl px-6 pb-16 pt-4 font-mono text-[11px] uppercase tracking-[0.18em]"
      style={{ color: 'var(--l-soft)' }}>
      bihapia
    </footer>
  );
}
