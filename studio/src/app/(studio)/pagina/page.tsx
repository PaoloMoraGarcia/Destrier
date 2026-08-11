import { Editor } from '@/components/landing/Editor';
import { loadEditorState } from '@/lib/landing.server';

export const metadata = { title: 'Página de venta · Bihapia Studio' };

export default async function PaginaPage() {
  const initial = await loadEditorState();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Página de venta</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
          La URL que enseñas a tu audiencia. Enciende, apaga y ordena los bloques;
          lo de la derecha es exactamente lo que se publica.
        </p>
      </header>

      <Editor initial={initial} />
    </div>
  );
}
