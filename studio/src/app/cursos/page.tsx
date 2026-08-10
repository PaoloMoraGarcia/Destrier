import { Card, EmptyState } from '@/components/Card';

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Cursos</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Monta tus cursos, ordena sus lecciones y ponles precio.
        </p>
      </div>

      <Card>
        <EmptyState
          title="Sección pendiente"
          body="Aquí irán la lista de cursos, la edición de sus datos y el orden de las lecciones. Todavía no está construida."
        />
      </Card>
    </div>
  );
}
