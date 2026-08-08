import { TextStyle } from 'react-native';

/**
 * Tipografía — §5 del contexto.
 *
 * Dos familias y ninguna más:
 *  - El wordmark en Dancing Script (script/cursiva, estilo "hello" de Apple).
 *  - Todo lo demás en la fuente del sistema (San Francisco en iOS, Roboto en
 *    Android). No se carga ninguna fuente de UI a propósito: la del sistema es
 *    la que mejor consigue el aire Cupertino y no cuesta un solo byte.
 */

export const fonts = {
  wordmark: 'DancingScript_700Bold',
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
