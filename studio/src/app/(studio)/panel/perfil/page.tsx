import { Card, EmptyState } from '@/components/Card';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Perfil</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Tu nombre, tu identificador y lo que verá quien llegue a tu contenido.
        </p>
      </div>

      <Card>
        <EmptyState
          title="Sección pendiente"
          body="Aquí irán el nombre visible, el identificador, el avatar y la solicitud de verificación. Todavía no está construida."
        />
      </Card>
    </div>
  );
}
