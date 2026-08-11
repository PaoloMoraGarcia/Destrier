-- Dos palabras más que el panel se reserva.
--
-- `0007` dejó la lista, y al mudar el panel a `/panel` aparecieron dos huecos:
-- `panel` y `entrar` no estaban. Con `/panel/pagina` existiendo, quien tuviera
-- el handle `panel` se quedaría con su página de venta inalcanzable para
-- siempre, porque una ruta estática gana a una dinámica.
--
-- Es justo el caso que la lista existe para impedir, y el motivo de que se
-- arregle antes y no después: un handle no se le puede quitar a alguien sin
-- romperle todos los enlaces que ya ha repartido.

alter table profiles drop constraint handle_not_reserved;

alter table profiles add constraint handle_not_reserved
  check (handle not in (
    'cursos', 'perfil', 'pagina', 'resumen', 'ajustes', 'login', 'logout',
    'api', 'admin', 'studio', 'estudio', 'app', 'www', 'bihapia',
    'panel', 'entrar'
  ));
