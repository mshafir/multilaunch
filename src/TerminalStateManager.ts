import { terminal } from "terminal-kit";
import { GlobalTerminalOperations, MouseActions, TerminalView } from './TerminalView';

export class TerminalStateManager implements GlobalTerminalOperations {
    private view?: TerminalView;

    async loadView(view: TerminalView) {
        this.view?.cleanup && await this.view.cleanup();
        this.view = view;
        this.view?.startup && await this.view.startup(this);
        terminal.clear();
        this.rerender();
    }

    rerender() {
        this.view && this.view.render();    
    }

    start() {
        terminal.grabInput({
            mouse: 'button'
        });
        terminal.fullscreen(true);

        if (!this.view) {
            terminal("There is no current view set!");
        }

        terminal.on('key', async (name: string, data: any) => {
            if (this.view && name in this.view.keyEvents) {
                if (await this.view.keyEvents[name]!(data, this)) {
                    this.rerender();
                }
            }
        });

        terminal.on('mouse', async (name: string, data: any) => {
            if (this.view && name in this.view.mouseEvents) {
                if (await this.view.mouseEvents[name as MouseActions]!(data, this)) {
                    this.rerender();
                }
            }
        })

        this.rerender();
    }

    async terminate() {
        terminal.grabInput(false);
        setTimeout(async () => { 
            this.view?.cleanup && await this.view.cleanup();
            terminal.processExit(0);
         }, 100);
    }
}
