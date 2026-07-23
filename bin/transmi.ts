#!/usr/bin/env bun

import { Command } from 'commander';
import { logger } from '../src/lib/logger.js';
import { planTripWithGoogleMaps } from '../src/services/planner/google-maps-planner.js';
import { searchRoutes } from '../src/services/scraper/routes-scraper.js';
import { showBanner } from '../src/utils/banner.js';

const program = new Command();

logger.setQuiet(true);
showBanner();

program
  .name('transmi')
  .description('Consulta rutas y planea viajes en transporte público por Bogotá')
  .version('0.1.0')
  .showHelpAfterError();

program
  .command('rutas')
  .alias('search')
  .description('Buscar rutas de TransMilenio')
  .argument('[busqueda]', 'Nombre, código o destino de la ruta', '')
  .action(async (busqueda: string) => {
    const routes = await searchRoutes(busqueda);
    if (routes.length === 0) {
      console.log('No se encontraron rutas.');
      return;
    }

    console.log(`\n${routes.length} ruta(s) encontrada(s):\n`);
    for (const route of routes.slice(0, 30)) {
      console.log(`  ${route.code.padEnd(8)} ${route.name} (${route.type})`);
    }
    if (routes.length > 30) console.log(`\n  ...y ${routes.length - 30} más.`);
  });

program
  .command('viaje')
  .alias('plan')
  .description('Planear un viaje entre direcciones, estaciones o lugares')
  .argument('<origen>', 'Dirección, estación o lugar de origen')
  .argument('<destino>', 'Dirección, estación o lugar de destino')
  .option('-o, --optimizar <criterio>', 'tiempo o transbordos', 'tiempo')
  .option('-a, --alternativas <cantidad>', 'cantidad de alternativas', '3')
  .action(
    async (
      origen: string,
      destino: string,
      options: { optimizar: string; alternativas: string }
    ) => {
      const optimizeFor = options.optimizar === 'transbordos' ? 'transfers' : 'time';
      const alternatives = Math.max(1, Math.min(6, Number.parseInt(options.alternativas, 10) || 3));
      const trip = await planTripWithGoogleMaps(origen, destino, optimizeFor);

      if (!trip.success) {
        console.error(`No fue posible planear el viaje: ${trip.error}`);
        process.exitCode = 1;
        return;
      }

      console.log(`\nDe: ${trip.resolvedOrigin ?? origen}`);
      console.log(`A:  ${trip.resolvedDestination ?? destino}\n`);

      trip.routes.slice(0, alternatives).forEach((route, routeIndex) => {
        console.log(
          `Opción ${routeIndex + 1}: ${route.duration} | ${route.departureTime} - ${route.arrivalTime}`
        );
        route.steps.forEach((step, stepIndex) => {
          const details = [
            step.duration,
            step.distance,
            step.stopCount ? `${step.stopCount} paradas` : undefined,
          ].filter(Boolean);
          console.log(
            `  ${stepIndex + 1}. ${step.instruction}${details.length ? ` (${details.join(', ')})` : ''}`
          );
        });
        console.log('');
      });

      console.log('Datos de rutas: Google Maps');
    }
  );

await program.parseAsync();
