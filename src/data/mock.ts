import { Author, Curiosity } from '@/types/domain';

/**
 * Datos de prueba para que el feed se pueda ver funcionando antes de que exista
 * el proyecto de Supabase. Se sirven desde `feedRepository` cuando la app arranca
 * sin credenciales.
 *
 * Los vídeos son clips públicos de prueba y son horizontales, así que
 * `contentFit="cover"` los recorta a vertical. Sirven para validar el snap, el
 * reciclado y la reproducción, no el encuadre.
 */

const SAMPLE_VIDEOS = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
];

const authors: Record<string, Author> = {
  nora: {
    id: 'a1',
    handle: 'noraverse',
    displayName: 'Nora Vessel',
    avatarUrl: null,
    isVerified: true,
  },
  kit: {
    id: 'a2',
    handle: 'kitbuilds',
    displayName: 'Kit Aranda',
    avatarUrl: null,
    isVerified: true,
  },
  sam: {
    id: 'a3',
    handle: 'samsaysless',
    displayName: 'Sam Oyelaran',
    avatarUrl: null,
    isVerified: false,
  },
};

export const MOCK_FEED: Curiosity[] = [
  {
    id: 'c1',
    kind: 'video',
    author: authors.kit,
    categorySlug: 'tech-web',
    videoUrl: SAMPLE_VIDEOS[0],
    posterUrl: null,
    engagement: { likes: 1284, comments: 96, saves: 311, likedByMe: false, savedByMe: false },
    course: {
      id: 'k1',
      title: 'Ship a landing page in a weekend',
      priceCents: 1900,
      currency: 'USD',
      itemCount: 12,
      unlocked: false,
    },
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'c2',
    kind: 'text',
    author: authors.sam,
    categorySlug: 'general-curiosities',
    body: "You will die without ever knowing what the deep ocean sounds like. That's fine. That's the good part.",
    backgroundColor: '#FFFFFF',
    foregroundColor: '#0A0A0A',
    engagement: { likes: 8412, comments: 512, saves: 2201, likedByMe: true, savedByMe: false },
    course: null,
    createdAt: '2026-08-02T09:12:00Z',
  },
  {
    id: 'c3',
    kind: 'video',
    author: authors.nora,
    categorySlug: 'business-sales',
    videoUrl: SAMPLE_VIDEOS[1],
    posterUrl: null,
    engagement: { likes: 640, comments: 41, saves: 128, likedByMe: false, savedByMe: true },
    course: {
      id: 'n1',
      title: 'Selling without sounding like a seller',
      priceCents: null,
      currency: 'USD',
      itemCount: 8,
      unlocked: true,
    },
    createdAt: '2026-08-03T18:40:00Z',
  },
  {
    id: 'c4',
    kind: 'text',
    author: authors.nora,
    categorySlug: 'business-sales',
    body: 'Nobody has read the whole internet. Nobody ever will. Pick a corner and enjoy it.',
    backgroundColor: '#F5A623',
    foregroundColor: '#0A0A0A',
    engagement: { likes: 3190, comments: 187, saves: 904, likedByMe: false, savedByMe: false },
    course: null,
    createdAt: '2026-08-04T08:05:00Z',
  },
  {
    id: 'c5',
    kind: 'video',
    author: authors.sam,
    categorySlug: 'general-curiosities',
    videoUrl: SAMPLE_VIDEOS[2],
    posterUrl: null,
    engagement: { likes: 221, comments: 12, saves: 44, likedByMe: false, savedByMe: false },
    course: null,
    createdAt: '2026-08-05T14:22:00Z',
  },
  {
    id: 'c6',
    kind: 'text',
    author: authors.kit,
    categorySlug: 'tech-web',
    body: 'The first website is still online. It has no images. It is perfect.',
    backgroundColor: '#101010',
    foregroundColor: '#FFFFFF',
    engagement: { likes: 5024, comments: 233, saves: 1408, likedByMe: false, savedByMe: false },
    course: {
      id: 'k1',
      title: 'Ship a landing page in a weekend',
      priceCents: 1900,
      currency: 'USD',
      itemCount: 12,
      unlocked: false,
    },
    createdAt: '2026-08-06T11:30:00Z',
  },
  {
    id: 'c7',
    kind: 'video',
    author: authors.nora,
    categorySlug: 'tech-web',
    videoUrl: SAMPLE_VIDEOS[3],
    posterUrl: null,
    engagement: { likes: 977, comments: 63, saves: 210, likedByMe: false, savedByMe: false },
    course: null,
    createdAt: '2026-08-06T20:10:00Z',
  },
];
