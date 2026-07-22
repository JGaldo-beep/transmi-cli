#!/usr/bin/env bun
// MCP Setup Script for Transmilenio CLI
// Auto-detects environment and installs MCP server

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { confirm, intro, note, outro, select, spinner } from '@clack/prompts';
import { colors } from '../src/lib/colors.js';

const PROJECT_ROOT = path.resolve(import.meta.dir, '..');
const MCP_SERVER_PATH = path.join(PROJECT_ROOT, 'src', 'mcp', 'server.ts');

async function main() {
  console.clear();

  intro(colors.bold(colors.cyan('🚍 Transmilenio MCP Setup')));

  // Detect environment
  const envs = detectEnvironments();

  if (envs.length === 0) {
    note(
      colors.yellow(
        `No se detectó Claude Code, Cursor o Windsurf.\nPuedes configurar manualmente el servidor MCP.\n\nComando: bun\nArgs: ["run", "${MCP_SERVER_PATH}"]`
      ),
      'Configuración manual'
    );
    outro(colors.yellow('Instalación cancelada'));
    process.exit(0);
  }

  // Select environment
  let selectedEnv: string;

  if (envs.length === 1) {
    selectedEnv = envs[0];
    note(`Detectado: ${colors.cyan(selectedEnv)}`, 'Entorno');
  } else {
    const result = await select({
      message: 'Detectamos múltiples herramientas. ¿Cuál quieres configurar?',
      options: envs.map((env) => ({ value: env, label: env })),
    });

    if (typeof result === 'symbol') {
      outro(colors.yellow('Instalación cancelada'));
      process.exit(0);
    }

    selectedEnv = result as string;
  }

  // Ask for scope (only for Claude Code)
  let scope: 'project' | 'global' = 'global';

  if (selectedEnv === 'Claude Code') {
    const scopeResult = await select({
      message: '¿Dónde quieres instalar el servidor MCP?',
      options: [
        {
          value: 'global',
          label: 'Global (todos los proyectos)',
          hint: 'Recomendado',
        },
        {
          value: 'project',
          label: 'Solo este proyecto',
        },
      ],
    });

    if (typeof scopeResult === 'symbol') {
      outro(colors.yellow('Instalación cancelada'));
      process.exit(0);
    }

    scope = scopeResult as 'project' | 'global';
  }

  // Confirm installation
  const shouldContinue = await confirm({
    message: `¿Instalar el servidor MCP de Transmilenio para ${selectedEnv}?`,
  });

  if (!shouldContinue || typeof shouldContinue === 'symbol') {
    outro(colors.yellow('Instalación cancelada'));
    process.exit(0);
  }

  // Install
  const s = spinner();
  s.start('Instalando servidor MCP...');

  try {
    switch (selectedEnv) {
      case 'Claude Code':
        await installClaudeCode(scope);
        break;
      case 'Cursor':
        await installCursor();
        break;
      case 'Windsurf':
        await installWindsurf();
        break;
    }

    s.stop('Instalación completada');

    note(
      colors.green(
        '✅ Servidor MCP instalado correctamente\n\n' +
          'Herramientas disponibles:\n' +
          '  • search_routes - Buscar entre 1,228 rutas\n' +
          '  • plan_trip - Planificar viajes\n' +
          '  • get_alerts - Ver alertas\n' +
          '  • check_balance - Consultar saldo\n\n' +
          'Ejemplos de uso:\n' +
          '  "Busca rutas de Portal Eldorado"\n' +
          '  "¿Cuántas rutas TransMilenio hay?"\n' +
          '  "Muéstrame rutas que pasan por Suba"'
      ),
      '¡Listo!'
    );

    if (selectedEnv === 'Claude Code') {
      note(
        `Ejecuta ${colors.cyan('/reload-plugins')} en Claude Code para activar el MCP`,
        'Próximo paso'
      );
    } else {
      note(`Reinicia ${selectedEnv} para activar el servidor MCP`, 'Próximo paso');
    }

    outro(colors.green('¡Gracias por usar Transmilenio CLI! 🚍'));
  } catch (error) {
    s.stop('Error en la instalación');
    note(
      colors.red(
        `Error: ${error instanceof Error ? error.message : String(error)}\n\nPuedes configurar manualmente el servidor MCP:\nComando: bun\nArgs: ["run", "${MCP_SERVER_PATH}"]`
      ),
      'Error'
    );
    process.exit(1);
  }
}

function detectEnvironments(): string[] {
  const envs: string[] = [];
  const home = os.homedir();

  // Check for Claude Code
  if (fs.existsSync(path.join(home, '.claude'))) {
    envs.push('Claude Code');
  }

  // Check for Cursor
  if (
    fs.existsSync(path.join(PROJECT_ROOT, '.cursor')) ||
    fs.existsSync(path.join(home, '.cursor'))
  ) {
    envs.push('Cursor');
  }

  // Check for Windsurf
  if (
    fs.existsSync(path.join(PROJECT_ROOT, '.windsurf')) ||
    fs.existsSync(path.join(home, '.windsurf'))
  ) {
    envs.push('Windsurf');
  }

  return envs;
}

async function installClaudeCode(scope: 'project' | 'global') {
  const $ = (await import('bun')).default.$;

  if (scope === 'project') {
    await $`claude mcp add transmilenio --scope project bun run ${MCP_SERVER_PATH}`;
  } else {
    await $`claude mcp add transmilenio bun run ${MCP_SERVER_PATH}`;
  }
}

async function installCursor() {
  const configPath = path.join(PROJECT_ROOT, '.cursor', 'mcp.json');
  await ensureDir(path.dirname(configPath));

  const config = {
    mcpServers: {
      transmilenio: {
        command: 'bun',
        args: ['run', MCP_SERVER_PATH],
      },
    },
  };

  // Read existing config if it exists
  if (fs.existsSync(configPath)) {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    existing.mcpServers = existing.mcpServers || {};
    existing.mcpServers.transmilenio = config.mcpServers.transmilenio;
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
  } else {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

async function installWindsurf() {
  const configPath = path.join(PROJECT_ROOT, '.windsurf', 'mcp.json');
  await ensureDir(path.dirname(configPath));

  const config = {
    mcpServers: {
      transmilenio: {
        command: 'bun',
        args: ['run', MCP_SERVER_PATH],
      },
    },
  };

  // Read existing config if it exists
  if (fs.existsSync(configPath)) {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    existing.mcpServers = existing.mcpServers || {};
    existing.mcpServers.transmilenio = config.mcpServers.transmilenio;
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
  } else {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

main().catch((error) => {
  console.error(colors.red('Error fatal:'), error);
  process.exit(1);
});
