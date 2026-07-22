#!/usr/bin/env bun

import { Command } from 'commander';
import { showBanner } from '../src/utils/banner.ts';

const program = new Command();

// Mostrar el banner al inicio
showBanner();

program
  .name('transmi')
  .description('CLI para consultar rutas y servicios de TransMilenio')
  .version('1.0.0');

program
  .command('rutas')
  .description('Buscar rutas de TransMilenio')
  .argument('[busqueda]', 'Término de búsqueda')
  .action((busqueda) => {
    if (busqueda) {
      console.log(`🔍 Buscando rutas: ${busqueda}...`);
    } else {
      console.log('📋 Mostrando todas las rutas...');
    }
    console.log('   [En desarrollo]');
  });

program
  .command('viaje')
  .description('Planear un viaje entre dos estaciones')
  .argument('<origen>', 'Estación de origen')
  .argument('<destino>', 'Estación de destino')
  .action((origen, destino) => {
    console.log(`🗺️  Planeando viaje de ${origen} a ${destino}...`);
    console.log('   [En desarrollo]');
  });

program
  .command('saldo')
  .description('Consultar saldo de tarjeta TuLlave')
  .argument('<tarjeta>', 'Número de tarjeta de 16 dígitos')
  .action((tarjeta) => {
    console.log(`💳 Consultando saldo de tarjeta ${tarjeta}...`);
    console.log('   [En desarrollo]');
  });

program
  .command('alertas')
  .description('Ver alertas y cambios operacionales')
  .action(() => {
    console.log('🚨 Consultando alertas del sistema...');
    console.log('   [En desarrollo]');
  });

program.parse();
