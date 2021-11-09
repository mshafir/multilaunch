import { readFileSync } from 'fs';
import { MainView } from './MainView';
import { TerminalStateManager } from './TerminalStateManager';

async function main() {
    if (process.argv.length < 3) {
        console.error("multilaunch requires a single json file command-line argument");
        process.exit(1);
    }
    const config = JSON.parse(readFileSync(process.argv[2]).toString());
    const stateManager = new TerminalStateManager();
    stateManager.loadView(new MainView(config));
    stateManager.start();
}

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1);
});

main();