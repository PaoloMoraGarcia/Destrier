import { redirect } from 'next/navigation';

import { EntrarForm } from './EntrarForm';
import { createClient, isConfigured } from '@/lib/supabase';

export const metadata = { title: 'Entrar · Bihapia Studio' };

export default async function EntrarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  // Con sesión, aquí no hay nada que hacer.
  if (user) redirect('/panel');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-16">
      <div className="mb-10">
        <span className="wordmark text-[30px] leading-none">bi&amp;hapia</span>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          El panel donde montas tus cursos y miras tus datos.
        </p>
      </div>

      {!isConfigured && (
        <p className="mb-6 rounded-xl border border-dashed border-line bg-amber-soft px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <strong className="font-medium text-ink">Falta conectar Supabase.</strong> Copia{' '}
          <code className="font-mono">studio/.env.example</code> a{' '}
          <code className="font-mono">studio/.env.local</code> con las claves de tu
          proyecto. Mientras tanto no se puede entrar, pero el panel enseña un curso
          de muestra.
        </p>
      )}

      <EntrarForm configured={isConfigured} />

      <p className="mt-8 text-[11px] leading-relaxed text-ink-faint">
        Te enviamos un código de seis cifras. Es la misma cuenta que la de la app:
        sin contraseña que recordar y sin conectar redes sociales.
      </p>
    </main>
  );
}
