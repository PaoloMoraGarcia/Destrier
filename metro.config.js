const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * `studio/` es el panel de creador: un proyecto Next.js con su propio
 * `node_modules`, que vive dentro de este repo para compartir git y Supabase.
 *
 * Metro rastrea la raíz del proyecto entero, así que sin esto intentaría
 * indexar ese árbol y resolver sus dependencias como si fueran de la app móvil.
 * Bloquearlo es lo que mantiene los dos proyectos separados de verdad.
 */
config.resolver.blockList = [new RegExp(`^${path.resolve(__dirname, 'studio')}/.*$`)];

module.exports = config;
