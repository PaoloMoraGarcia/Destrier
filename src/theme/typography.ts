import { Platform, TextStyle } from 'react-native';

/**
 * Tipografía.
 *
 * Tres familias y ninguna más:
 *  - **Wordmark**: Special Gothic Expanded One, una grotesca display muy ancha,
 *    que se usa siempre en hueco. Sustituye a la cursiva que planteaba el §5 del
 *    contexto original: la dirección cambió a un lenguaje técnico y geométrico.
 *  - **Mono**: IBM Plex Mono para el eslogan y los metadatos. Es la voz
 *    secundaria del sistema — fina, técnica, de ficha.
 *  - **UI**: la fuente del sistema (San Francisco en iOS, Roboto en Android).
 *    No se carga nada a propósito: es la que mejor da el aire Cupertino y no
 *    cuesta un solo byte.
 *
 * Las dos primeras son de Google Fonts con licencia OFL, así que se pueden
 * incrustar en la app sin más trámite.
 */

export const fonts = {
  wordmark: 'SpecialGothicExpandedOne_400Regular',
  mono: 'IBMPlexMono_300Light',

  /**
   * La fuente del sistema, escrita a mano para SVG.
   *
   * Un `<Text>` de React Native hereda la del sistema si no se dice nada, pero
   * un texto SVG **no**: en web cae al serif del navegador. Cualquier texto que
   * se dibuje en SVG tiene que declarar familia explícitamente.
   */
  uiStack: Platform.select({
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'System',
  }) as string,
} as const;

/**
 * Escala tipo iOS. El `letterSpacing` negativo en los tamaños grandes es lo que
 * evita que el texto se lea "de Android" — Apple aprieta el tracking según sube
 * el cuerpo.
 */
export const type = {
  wordmark: {
    fontFamily: fonts.wordmark,
    fontSize: 76,
    lineHeight: 104,
    color: '#FFFFFF',
  } satisfies TextStyle,

  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -0.6,
  } satisfies TextStyle,

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.4,
  } satisfies TextStyle,

  /** Cuerpo de las entradillas de texto del feed. */
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.3,
  } satisfies TextStyle,

  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.2,
  } satisfies TextStyle,

  callout: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.1,
  } satisfies TextStyle,

  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  } satisfies TextStyle,

  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  } satisfies TextStyle,
} as const;
