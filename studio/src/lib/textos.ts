/**
 * Todo el texto de la landing, en los dos idiomas.
 *
 * **Un solo sitio, y a propósito.** El texto estaba incrustado en cada
 * componente, que es cómodo mientras hay un idioma y se vuelve imposible al
 * segundo: para saber si una frase está traducida habría que abrir nueve
 * archivos. Aquí las dos versiones están una al lado de la otra y un hueco se ve
 * a simple vista.
 *
 * **No es una librería de i18n.** No hay interpolación, ni plurales, ni carga
 * diferida, ni catálogos. Es un objeto tipado: `Textos` describe la forma, y las
 * dos versiones tienen que cumplirla — si mañana se añade una frase en inglés y
 * no en español, no compila. Eso es lo único que hace falta para dos idiomas y
 * una página, y una dependencia nueva no daría nada más.
 *
 * **El español no es el inglés traducido.** Se ha escrito en español. Una
 * traducción literal de *It stays looked after* no existe; lo que existe es decir
 * la misma idea como se diría.
 *
 * El wordmark no se traduce: `destrier` es el nombre. El lema sí — es una frase,
 * y una frase en una página en español se lee en español.
 *
 * ## La voz: **Destrier hace el trabajo**
 *
 * Ni "yo" ni "nosotros": la marca se nombra a sí misma como quien ejecuta. La
 * página estuvo escrita en primera persona —*I build*, *yo construyo*— y sonaba a
 * autónomo; el encargo fue que sonara a estudio.
 *
 * Sigue cumpliendo la regla de que **se vea quién hace el trabajo y que sigue ahí
 * después de entregar**, que es lo que la página arrastró mal durante media
 * docena de pasadas. Lo que cambia es que quien lo hace tiene nombre de marca.
 *
 * Y con eso se van los coloquialismos que venían con la otra voz: *en pie*, *se
 * te da bien*, *soltado encima de una plantilla*, *la mitad que no ofrece nadie*.
 *
 * La única primera persona que queda es la de quien entra —*I want to teach*,
 * *Quiero enseñar*— y esa es justo la que tiene que quedarse.
 */

export type Idioma = 'en' | 'es';

/** Los fallos que puede devolver `enviarSolicitud`, sin el texto. */
export type ClaveError =
  | 'sin-nombre'
  | 'correo-invalido'
  | 'sin-tema'
  | 'demasiado-largo'
  | 'fallo';

interface Bloque {
  numero: string;
  titulo: string;
  cuerpo: string;
}

export interface Textos {
  /**
   * Lo que se ve fuera de la página: la pestaña, el resultado de búsqueda y la
   * tarjeta que sale al pegar el enlace en un chat.
   *
   * **Tiene que decir qué se vende.** Durante muchas pasadas el título fue *«Sé
   * feliz con las cosas que no sabes»*, que es el lema de **bi&hapia, la app** —
   * la filosofía anti-FOMO del feed—. En la página del estudio no decía
   * absolutamente nada del negocio, y estaba en la cadena más visible que existe.
   * La misma confusión de identidad de siempre, en el peor sitio posible.
   */
  meta: { titulo: string; descripcion: string; lema: string };

  hero: {
    /** Lo que va antes del hueco. El hueco lo rellena quien entra. */
    titular: string;
    /** Los ejemplos que rotan. Concretos y de mundos distintos: el rango es el mensaje. */
    ejemplos: string[];
  };

  /**
   * `idea` lleva la frase, el enlace de la llamada y los aparatos.
   *
   * Había uno debajo de la frase negra diciendo lo mismo con menos fuerza, y le
   * quitaba peso a lo que tenía encima. Debajo de la frase van la llamada y los
   * aparatos, que se mudaron aquí desde la sección blanca.
   */
  idea: {
    eyebrow: string;
    texto: string;
    /** El enlace para agendar llamada, que sustituyó al botón. */
    agendar: string;
    /** La frase que presenta los aparatos, ya dentro del negro. */
    aparatosFrase: string;
    /** Y lo que los describe para quien no los ve. */
    aparatos: string;
  };

  about: {
    eyebrow: string;
    titular: string;
    lead: string;
    pasos: Bloque[];
  };

  /**
   * **Qué se compra**, no cómo se trabaja.
   *
   * Esta sección explicaba el método —un solo resultado, para usarlo y no
   * aprenderlo, se mantiene— y eso es interesante para quien ya ha decidido. Quien
   * llega por primera vez necesita antes saber qué vende esta página, y el negocio
   * son dos cosas: sistemas para quien enseña y webs de empresa.
   */
  servicios: { eyebrow: string; texto: string; lista: Bloque[] };

  contacto: {
    eyebrow: string;
    titular: string;
    campos: { name: string; email: string; teach: string; who: string; outcome: string };
    enviar: string;
    enviando: string;
    /** Lleva `{correo}`, que se sustituye por el que haya escrito. */
    gracias: string;
    graciasNota: string;
    mailtoNota: string;
    /** Lleva `{nombre}`. */
    asunto: string;
    sinNombre: string;
    alguien: string;
    errores: Record<ClaveError, string>;
    /** Marca los dos campos que se pueden dejar en blanco. */
    opcional: string;
  };

  pie: { enlaces: { href: string; label: string }[] };

  idioma: { etiqueta: string };
}

const en: Textos = {
  meta: {
    titulo: 'Destrier · Systems for people who teach, sites that bring clients',
    descripcion:
      'Courses, bookings, payments and a student area — or the site that brings your clients in. Destrier builds it and keeps it running.',
    lema: 'Built, and then maintained',
  },

  hero: {
    titular: 'I want a system for',
    // Los cinco cubren las dos mitades del negocio: los tres primeros son quien
    // enseña, los dos últimos son empresa. Si algún día quedan solo de un tipo,
    // la portada vuelve a excluir a media clientela sin que se note.
    ejemplos: [
      'selling my courses',
      'booking my classes',
      'charging for mentoring',
      'bringing in clients',
      'presenting my company',
    ],
  },

  idea: {
    eyebrow: 'What this is',
    texto:
      'Destrier builds the system your business runs on — and keeps it in working order.',
    agendar: 'Book a call',
    aparatosFrase: 'What we can do with your idea',
    aparatos: 'The same site running on a laptop and on a phone.',
  },

  about: {
    eyebrow: 'What Destrier is',
    titular: 'You do the work. Destrier builds and maintains what sells it.',
    lead: 'Destrier is a service, not a platform. There is nothing to sign up for and nothing to learn: you describe what you need, and Destrier designs it, builds it and keeps it running. Two kinds of work — systems for people who teach, and websites for companies that want more clients.',
    pasos: [
      {
        numero: '01',
        titulo: 'You already have the thing',
        cuerpo:
          'A diver who can read a reef. A workshop with fifteen years behind it. The knowledge or the business is already there — that is not the part that needs solving.',
      },
      {
        numero: '02',
        titulo: 'It gets designed and built',
        cuerpo:
          'Courses, bookings, payments, a student area, a company site. Designed and written around the subject and its audience, rather than adapted onto a template.',
      },
      {
        numero: '03',
        titulo: 'And it stays maintained',
        cuerpo:
          'This is the half that is rarely offered. Nothing is handed over and forgotten: it is kept updated, kept working and looked after, month after month.',
      },
    ],
  },

  servicios: {
    eyebrow: 'What Destrier sells',
    texto: 'Two kinds of work, and both are built and then maintained.',
    lista: [
      {
        numero: '01',
        titulo: 'Systems for people who teach',
        cuerpo:
          'Courses, bookings, payments and a student area — everything needed to charge for what you know without gluing five tools together. For anyone who already knows something and wants to make a living teaching it.',
      },
      {
        numero: '02',
        titulo: 'Websites for companies',
        cuerpo:
          'A clear presence, written and built so that clients actually get in touch. Not to look nice: to bring in work. With the pages, the forms and the measurement that makes it possible to tell whether it is working.',
      },
    ],
  },

  contacto: {
    eyebrow: 'Contact',
    titular: 'Tell us what you need',
    campos: {
      name: 'Name',
      email: 'Email',
      teach: 'What do you need a system for?',
      who: 'Who is it for?',
      outcome: 'What should someone be able to do afterwards?',
    },
    enviar: 'Send it over',
    enviando: 'Sending…',
    gracias: 'Received. You will get a reply at {correo}.',
    graciasNota: 'Nothing further is needed — no account, no confirmation email.',
    mailtoNota: 'This opens your email client with the answers already written.',
    asunto: 'A new enquiry: {nombre}',
    sinNombre: 'no name',
    alguien: 'Someone',
    errores: {
      'sin-nombre': 'A name is required.',
      'correo-invalido': 'That address does not look like a valid email.',
      'sin-tema': 'Please describe what you need.',
      'demasiado-largo': 'One of the answers exceeds the allowed length.',
      fallo: 'The request could not be saved. Please try again shortly.',
    },
    opcional: 'optional',
  },

  pie: {
    enlaces: [
      { href: '#idea', label: 'What this is' },
      { href: '#about', label: 'What Destrier is' },
      { href: '#path', label: 'What Destrier sells' },
      { href: '#contact', label: 'Contact' },
    ],
  },

  idioma: { etiqueta: 'Language' },
};

const es: Textos = {
  meta: {
    titulo: 'Destrier · Sistemas para quien enseña y webs que traen clientes',
    descripcion:
      'Cursos, reservas, pagos y área de alumnos, o la web que capta a tus clientes. Destrier lo construye y lo mantiene en marcha.',
    lema: 'Se construye, y después se mantiene',
  },

  hero: {
    titular: 'Quiero un sistema para',
    ejemplos: [
      'vender mis cursos',
      'reservar mis clases',
      'cobrar mis mentorías',
      'captar más clientes',
      'presentar mi empresa',
    ],
  },

  idea: {
    eyebrow: 'Qué es esto',
    texto:
      'Destrier construye el sistema con el que funciona tu negocio, y se ocupa de mantenerlo.',
    agendar: 'Agendar una llamada',
    aparatosFrase: 'Lo que podemos hacer con tu idea',
    aparatos: 'El mismo sitio funcionando en un portátil y en un móvil.',
  },

  about: {
    eyebrow: 'Qué es Destrier',
    titular: 'Tú haces el trabajo. Destrier construye y mantiene lo que lo vende.',
    lead: 'Destrier es un servicio, no una plataforma. No hay nada que registrar ni nada que aprender: cuentas qué necesitas y Destrier lo diseña, lo construye y lo mantiene en marcha. Dos tipos de trabajo — sistemas para quien enseña, y webs de empresa para quien quiere más clientes.',
    pasos: [
      {
        numero: '01',
        titulo: 'Lo que sabes ya lo tienes',
        cuerpo:
          'Un submarinista que sabe leer un arrecife. Un taller con quince años detrás. El conocimiento o el negocio ya están ahí — esa no es la parte que hay que resolver.',
      },
      {
        numero: '02',
        titulo: 'Se diseña y se construye',
        cuerpo:
          'Cursos, reservas, pagos, área de alumnos, web de empresa. Diseñado y redactado en torno a lo que haces y a quién se lo ofreces, no adaptado sobre una plantilla.',
      },
      {
        numero: '03',
        titulo: 'Y se mantiene',
        cuerpo:
          'Esta es la mitad que rara vez se ofrece. No se entrega y se olvida: se mantiene actualizado, funcionando y bajo supervisión, mes a mes.',
      },
    ],
  },

  servicios: {
    eyebrow: 'Qué vende Destrier',
    texto: 'Dos tipos de trabajo, y los dos se construyen y después se mantienen.',
    lista: [
      {
        numero: '01',
        titulo: 'Sistemas para quien enseña',
        cuerpo:
          'Cursos, reservas, pagos y área de alumnos — todo lo que hace falta para cobrar por lo que sabes sin pegar cinco herramientas con cinta. Para quien ya sabe algo y quiere vivir de enseñarlo.',
      },
      {
        numero: '02',
        titulo: 'Webs de empresa',
        cuerpo:
          'Una presencia clara, escrita y construida para que entren clientes. No para hacer bonito: para traer trabajo. Con las páginas, los formularios y la medición que permiten saber si está funcionando.',
      },
    ],
  },

  contacto: {
    eyebrow: 'Contacto',
    titular: 'Cuéntanos qué necesitas',
    campos: {
      name: 'Nombre',
      email: 'Correo',
      teach: '¿Para qué quieres el sistema?',
      who: '¿Para quién es?',
      outcome: '¿Qué tendría que poder hacer alguien después?',
    },
    enviar: 'Enviar',
    enviando: 'Enviando…',
    gracias: 'Recibido. Recibirás una respuesta en {correo}.',
    graciasNota: 'No hace falta nada más: ni cuenta, ni correo de confirmación.',
    mailtoNota: 'Esto abre tu cliente de correo con las respuestas ya escritas.',
    asunto: 'Nueva consulta: {nombre}',
    sinNombre: 'sin nombre',
    alguien: 'Alguien',
    errores: {
      'sin-nombre': 'Falta el nombre.',
      'correo-invalido': 'Esa dirección no parece un correo válido.',
      'sin-tema': 'Cuéntanos qué necesitas.',
      'demasiado-largo': 'Alguna de las respuestas supera la longitud permitida.',
      fallo: 'No se ha podido guardar la solicitud. Inténtalo de nuevo en unos momentos.',
    },
    opcional: 'opcional',
  },

  pie: {
    enlaces: [
      { href: '#idea', label: 'Qué es esto' },
      { href: '#about', label: 'Qué es Destrier' },
      { href: '#path', label: 'Qué vende Destrier' },
      { href: '#contact', label: 'Contacto' },
    ],
  },

  idioma: { etiqueta: 'Idioma' },
};

export const TEXTOS: Record<Idioma, Textos> = { en, es };
