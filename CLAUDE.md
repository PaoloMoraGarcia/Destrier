# Bihapia

App móvil de feed vertical (tipo Reels) con filosofía anti-FOMO y una capa de
microcursos freemium. Expo (React Native) + Supabase.

**Antes de tocar nada de producto o diseño, lee `../BIHAPIA_CONTEXT.md`.** Es la
fuente de verdad de todas las decisiones tomadas. Este archivo solo cubre cómo
está montado el código. El porqué técnico está en `docs/decisions.md`.

## Arrancar

```bash
npx expo start
```

Escanea el QR con Expo Go, o `--ios` / `--android` para simulador. Sin `.env.local`
la app funciona igualmente: el feed sirve los datos de `src/data/mock.ts`.

## Mapa

- `src/app/` — rutas (expo-router). `index.tsx` es el splash, `feed.tsx` el feed.
- `src/theme/` — paleta, tipografía, espaciado, curvas de animación. **Todo color,
  tamaño y duración sale de aquí**; no hay literales sueltos en los componentes.
- `src/components/GlassSurface.tsx` — la única abstracción del material Liquid
  Glass. Ninguna pantalla debe importar `BlurView` ni `GlassView` directamente.
- `src/components/feed/` — lista, tarjetas y panel de interacción.
- `src/data/feedRepository.ts` — única puerta de entrada del feed a los datos.
- `supabase/migrations/` — esquema y RLS. Ver `docs/data-model.md`.

## Reglas que no se rompen

- **La curiosidad es siempre gratis.** No añadas precio a `curiosities`, ni en la
  base de datos ni en los tipos. El paywall vive solo en los cursos.
- **Cobrar exige verificación.** El trigger `courses_require_verification` lo
  impone en la base de datos; no lo dupliques ni lo sustituyas por una
  comprobación en el cliente.
- **La primera vista de una publicación no lleva interfaz.** Ni iconos, ni
  nombre, ni contadores. Todo eso aparece al tocar. Si añades algo encima del
  contenido por defecto, estás rompiendo el §5.
- **Nada escribe en `purchases` desde el cliente.** Eso lo hace el webhook del
  proveedor de pago con la service role key.

## Verificar un cambio

```bash
npm run typecheck
```

Y pruébalo en un dispositivo o simulador: el splash y el feed son gesto y
animación, y ningún test estático te va a decir si se sienten bien.
