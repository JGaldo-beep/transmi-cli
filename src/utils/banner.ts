import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

const bus = `
   ___________________________________________._________________
  |  ___   ___   ___   ___  |  ___   ___   ___ |              |
  | |   | |   | |   | |   | | |   | |   | |   ||  TRANSMILENIO|
  | |___| |___| |___| |___| | |___| |___| |___||              |
  |_________________________|_________________||______________|
  | ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ ╔═══╗ || ╔═══╗ ╔═══╗ |
  | ║   ║ ║   ║ ║   ║ ║   ║ ║   ║ ║   ║ ║   ║ || ║   ║ ║   ║ |
  |_║___║_║___║_║___║_║___║_║___║_║___║_║___║_||_║___║_║___║_|
     O=O     O=O     O=O     O=O     O=O     O=O    O=O   O=O
`;

export function showBanner(): void {
  const transmiGradient = gradient(['#E31E24', '#FDB913', '#E31E24']); // Colores de TransMilenio: rojo y amarillo

  // Crear el texto ASCII
  const asciiText = figlet.textSync('Transmi', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true,
  });

  // Mostrar el bus en color rojo
  console.log(chalk.red(bus));

  // Mostrar el texto con gradiente
  console.log(transmiGradient.multiline(asciiText));

  // Subtítulo
  console.log(chalk.gray('  Tu asistente de rutas de TransMilenio 🚌\n'));
}

export function showWelcome(): void {
  console.log(chalk.yellow('━'.repeat(60)));
  console.log(chalk.bold.red('  🚌  Bienvenido al CLI de TransMilenio'));
  console.log(chalk.gray('  Consulta rutas, planea viajes y más...'));
  console.log(`${chalk.yellow('━'.repeat(60))}\n`);
}
