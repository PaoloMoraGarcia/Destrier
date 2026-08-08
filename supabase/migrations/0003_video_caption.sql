-- Caption de los reels de vídeo.
--
-- El §9 dejaba abierto si el caption iba "quemado" dentro del archivo de vídeo.
-- Se decidió que no: el caption es un campo de datos y lo pinta la app. Así es
-- buscable, traducible y accesible, y se puede moderar o retirar sin pedirle al
-- creador que vuelva a subir el vídeo.
--
-- Nota: mientras el esquema no se haya aplicado a ninguna base de datos real,
-- esta migración se puede fundir con 0001. En cuanto haya un primer despliegue,
-- append-only.

alter table curiosities
  add column caption text check (char_length(caption) <= 140);

-- Una entradilla de texto ya es texto: su cuerpo está en `text_body`. Un caption
-- ahí sería una segunda fuente de verdad para lo mismo.
alter table curiosities
  add constraint caption_only_on_video
  check (caption is null or kind = 'video');

comment on column curiosities.caption is
  'Texto que la app pinta sobre el vídeo al tocarlo. Nunca va quemado en el archivo.';
