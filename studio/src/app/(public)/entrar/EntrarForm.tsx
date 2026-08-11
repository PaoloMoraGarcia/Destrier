'use client';

import { useState, useTransition } from 'react';

import { requestCode, verifyCode } from '@/lib/auth.actions';

/**
 * Entrar en dos pasos: primero el correo, luego el código que llega a él.
 *
 * El segundo paso deja ver y corregir el correo escrito. Equivocarse de letra al
 * teclearlo es lo más normal del mundo, y sin esa salida el único camino es
 * esperar un código que no va a llegar nunca.
 */
export function EntrarForm({ configured }: { configured: boolean }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    start(async () => {
      const result =
        step === 'email' ? await requestCode(email) : await verifyCode(email, code);

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Verificar redirige desde el servidor; solo se avanza tras pedir código.
      if (step === 'email') setStep('code');
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {step === 'email' ? (
        <label className="block">
          <span className="mb-2 block text-xs text-ink-soft">Tu correo</span>
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ink"
          />
        </label>
      ) : (
        <>
          <label className="block">
            <span className="mb-2 block text-xs text-ink-soft">
              El código que hemos enviado a {email}
            </span>
            <input
              inputMode="numeric"
              required
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              className="w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-ink outline-none placeholder:text-ink-faint focus:border-ink"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            className="text-xs text-ink-faint underline-offset-2 hover:text-ink hover:underline">
            Usar otro correo
          </button>
        </>
      )}

      {error && <p className="text-xs leading-relaxed text-ink">{error}</p>}

      <button
        type="submit"
        disabled={pending || !configured}
        className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
        {pending
          ? 'Un momento…'
          : step === 'email'
            ? 'Enviarme un código'
            : 'Entrar'}
      </button>
    </form>
  );
}
