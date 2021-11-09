import { terminal } from "terminal-kit";
import { StateUpdate, TerminalStateOperations, TerminalView } from './TerminalView';

export class TerminalStateManager implements TerminalStateOperations {
    private state: any;
    private view?: TerminalView<any>;

    async loadView(view: TerminalView<any>) {
        this.view?.cleanup && await this.view.cleanup();
        this.view = view;
        this.state = this.view.initialState;
        this.view?.startup && await this.view.startup(this);
        terminal.clear();
        this.rerender();
        return this.state;
    }

    updateState<S=any>(state: S | StateUpdate<S>): S {
        let newState;
        if (typeof(state) === 'function') {
            newState = (state as StateUpdate<S>)(this.state);
        } else {
            newState = state;
        }
        if (newState !== this.state) {
            this.state = newState;
            this.rerender();
        }
        return newState;
    }

    rerender() {
        this.view && this.view.render(this.state);    
    }

    start() {
        terminal.grabInput({});

        if (!this.view) {
            terminal("There is no current view set!");
        }

        terminal.on('key', async (name: string) => {
            if (name === 'ESCAPE') {
                await this.terminate();
            } else if (this.view && name in this.view.keyEvents) {
                this.state = await this.view.keyEvents[name](this.state, this);
                this.rerender();
            } else if (this.view) {
                console.log('unhandled keyinput', name);
            }
        });

        this.rerender();
    }

    async terminate() {
        terminal.grabInput(false);
        setTimeout(async () => { 
            this.view?.cleanup && await this.view.cleanup();
            process.exit();
         }, 100);
    }
}
