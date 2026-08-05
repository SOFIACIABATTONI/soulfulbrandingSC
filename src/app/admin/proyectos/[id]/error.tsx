"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminProyectoError({ error, reset }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-lg font-semibold text-brand-navy">No se pudo cargar el proyecto</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Ocurrió un error al mostrar el workspace. Podés reintentar o volver al listado.
      </p>
      <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
        {error.message}
      </pre>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-navy px-4 py-2 text-xs font-medium text-white"
        >
          Reintentar
        </button>
        <a
          href="/admin/proyectos"
          className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-800"
        >
          Volver a proyectos
        </a>
      </div>
    </div>
  );
}
