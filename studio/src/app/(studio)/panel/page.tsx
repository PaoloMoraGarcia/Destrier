import { ActivityChart } from '@/components/ActivityChart';
import { Card, EmptyState, Stat } from '@/components/Card';
import { formatCount, formatMoney, loadOverview } from '@/lib/analytics';
import { isConfigured } from '@/lib/supabase';

export default async function OverviewPage() {
  const overview = await loadOverview();
  const { totals, daily, available } = overview;
  const hasActivity = daily.some((point) => point.views > 0 || point.revenueCents > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Resumen</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Lo que ha pasado con tu contenido en los últimos 28 días.
        </p>
      </div>

      {!isConfigured && <NotConfigured />}
      {isConfigured && !available && <NotSignedIn />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Ingresos" value={formatMoney(totals.revenueCents)} foot="Acumulado" />
        <Stat label="Vistas" value={formatCount(totals.views)} />
        <Stat label="Seguidores" value={formatCount(totals.followers)} />
        <Stat label="Cursos publicados" value={String(totals.publishedCourses)} />
      </div>

      <Card title="Vistas por día" hint="28 días">
        {hasActivity ? (
          <ActivityChart data={daily} />
        ) : (
          <EmptyState
            title="Todavía no hay actividad"
            body="En cuanto publiques tu primera curiosidad y alguien la vea entera, la curva empezará a dibujarse aquí."
          />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tus cursos">
          <EmptyState
            title="Aún no has creado ningún curso"
            body="Podrás montarlos, ordenar sus lecciones y ponerles precio desde la sección Cursos."
          />
        </Card>

        <Card title="Verificación">
          <EmptyState
            title="Sin verificar"
            body="Publicar contenido gratuito no la necesita. Hace falta para poder cobrar por un curso."
          />
        </Card>
      </div>
    </div>
  );
}

/**
 * El panel existe para enseñar datos reales, así que cuando no puede los pide en
 * vez de inventarlos. Es lo que se verá hasta que exista el proyecto de
 * Supabase.
 */
function NotConfigured() {
  return (
    <div className="rounded-xl border border-amber/40 bg-amber-soft px-5 py-4">
      <p className="text-sm font-medium text-ink">Falta conectar Supabase</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Copia <code className="font-mono">.env.example</code> a{' '}
        <code className="font-mono">.env.local</code> y rellena{' '}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Hasta entonces las cifras
        de abajo son ceros, no datos.
      </p>
    </div>
  );
}

function NotSignedIn() {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-sm font-medium text-ink">No has iniciado sesión</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
        Los datos de un creador solo se pueden leer con su sesión: las funciones que los calculan
        filtran por quien pregunta.
      </p>
    </div>
  );
}
