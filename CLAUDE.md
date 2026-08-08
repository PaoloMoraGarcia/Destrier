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

Y en otra ventana, Run desde Xcode (`xed ios`) o `npx expo run:ios`. El montaje
nativo de esta máquina está en [docs/native-setup.md](docs/native-setup.md) —
tiene truco, porque el Ruby del sistema no sirve.

Sin `.env.local` la app funciona igualmente: el feed sirve los datos de
`src/data/mock.ts` y no hay sesión. **Ese camino no se puede romper**: es lo que
permite trabajar en la interfaz sin backend.

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
- **El wordmark no es una fuente.** Es lettering de línea única en
  `src/components/handwriting/`. No lo sustituyas por texto con una tipografía
  cursiva: una fuente da contornos cerrados y entonces la animación deja de ser
  escritura y pasa a ser un barrido, que es justo lo que se descartó.
- **El feed tiene tres niveles y un solo valor que los gobierna.** `depth` va de
  0 (contenido limpio) a 1 (caption) a 2 (ficha completa). No añadas estados
  paralelos: el caption y la ficha son valores derivados de `depth`.
- **Del tap no sale nada desde abajo.** En un reel se abre una hoja blanca desde
  el centro con el caption; en una entradilla de texto solo aparece la firma. Si
  vuelves a montar un panel inferior, estás deshaciendo una decisión tomada.
- **Sin contadores en ningún sitio.** La ficha tiene botones que cambian de color,
  no números. Enseñar cuánta gente ha dado a "me gusta" es la comparación social
  que el producto existe para evitar.
- **El caption nunca va quemado en el vídeo.** Es un campo de `curiosities` que
  pinta la app, para que sea moderable, traducible y accesible.
- **Nada escribe en `purchases` desde el cliente.** Eso lo hace el webhook del
  proveedor de pago con la service role key.
- **El feed se ve sin cuenta.** El §2 dice que la curiosidad no tiene fricción.
  La sesión se pide en el momento de interactuar, nunca al abrir la app. No
  metas un muro de registro en la puerta.
- **Los cursos se cobran con IAP, no con Stripe.** Es obligatorio en iOS
  (guideline 3.1.1) y condiciona el margen. Ver [docs/app-store.md](docs/app-store.md).
- **No añadas login social sin leer antes** `docs/app-store.md`: en cuanto haya
  Google o Facebook, Sign in with Apple pasa a ser obligatorio.

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
