# Compilar la app nativa en este Mac

Lo que costó dejar esto funcionando, para no repetirlo.

## El problema

macOS trae Ruby 2.6 y no sirve. Dos cosas lo impiden a la vez:

- Los scripts de autolinking de Expo usan `filter_map`, que **es de Ruby 2.7**.
- CocoaPods 1.13 es la primera versión que entiende `visionos.deployment_target`,
  que aparece en los podspecs de React Native 0.86, y las versiones modernas de
  CocoaPods y sus dependencias (`ffi`, `securerandom`, `zeitwerk`) exigen Ruby
  3.x.

No hay Homebrew en la máquina, y el instalador oficial pide contraseña. Así que
el Ruby se compila.

## Cómo quedó montado

```bash
# rbenv y ruby-build desde git, sin sudo
git clone --depth 1 https://github.com/rbenv/rbenv.git ~/.rbenv
git clone --depth 1 https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build

# libyaml, que Ruby 3.x necesita para psych (YAML) y no está en el sistema.
# Sin esto la compilación termina "correctamente" pero sin psych, y CocoaPods
# no arranca porque Podfile.lock es YAML.
curl -L https://github.com/yaml/libyaml/releases/download/0.2.5/yaml-0.2.5.tar.gz | tar xz
cd yaml-0.2.5 && ./configure --prefix="$HOME/.local" && make && make install

# Ruby
export RUBY_CONFIGURE_OPTS="--disable-install-doc --with-libyaml-dir=$HOME/.local"
~/.rbenv/bin/rbenv install 3.3.12
```

El `.ruby-version` del repo fija 3.3.12, y el `Gemfile` trae CocoaPods. El
`Gemfile.lock` **se commitea**: es lo que hace que la próxima máquina compile con
las mismas versiones.

## Uso diario

```bash
export PATH="$HOME/.rbenv/versions/3.3.12/bin:$PATH"

npx expo prebuild --platform ios   # regenera ios/ desde app.json
cd ios && bundle exec pod install
xed ios                            # abre Bihapia.xcworkspace en Xcode
```

Y en Xcode, Run sobre el simulador. Metro tiene que estar corriendo aparte
(`npx expo start`), porque la build de Debug carga el JavaScript desde ahí.

## Lo que no hay que tocar

`ios/` y `android/` están en `.gitignore` a propósito: son artefactos que
`prebuild` regenera desde `app.json`. Si editas el proyecto de Xcode a mano, el
siguiente `prebuild` se lo lleva por delante. La configuración nativa —permisos,
iconos, identificadores— va en `app.json` o en un config plugin.

## La alternativa

Nada de esto hace falta para compilar en la nube con EAS Build, que además es lo
que se usará para TestFlight y para la tienda. Este montaje local sirve para
depurar en Xcode y para iterar rápido; si un día se rompe, EAS sigue funcionando.
