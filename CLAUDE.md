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
- **Del tap no sale nada desde abajo.** En un reel se abre una hoja blanca desde
  el centro con el caption; en una entradilla de texto solo aparece la firma. Si
  vuelves a montar un panel inferior, estás deshaciendo una decisión tomada.
- **El caption nunca va quemado en el vídeo.** Es un campo de `curiosities` que
  pinta la app, para que sea moderable, traducible y accesible.
- **Nada escribe en `purchases` desde el cliente.** Eso lo hace el webhook del
  proveedor de pago con la service role key.

## Verificar un cambio

```bash
npm run typecheck    # tipos
npm run test:schema  # esquema SQL contra un Postgres real, sin Docker
```

Y pruébalo en un dispositivo o simulador: el splash y el feed son gesto y
animación, y ningún test estático te va a decir si se sienten bien.

Si tocas `supabase/migrations/`, `npm run test:schema` es obligatorio. Las reglas
de monetización del §2 y del §4 están escritas como constraints, y ese test es lo
único que comprueba que siguen bloqueando lo que deben.
