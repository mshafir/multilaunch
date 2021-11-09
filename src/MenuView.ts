import { terminal } from 'terminal-kit';
import { TerminalKeyActions, TerminalStateOperations, TerminalView } from './TerminalView';

export interface MenuState {
    options: string[];
    currentOption: number;
}

export class MenuView implements TerminalView<MenuState> {
    initialState: MenuState;

    keyEvents: TerminalKeyActions<MenuState> = {
        DOWN: async ({ currentOption, options, ...rest }: MenuState) => {
            const newOption = currentOption === options.length ? 1 : currentOption + 1;
            return { currentOption: newOption, options, ...rest };
        },
        UP: async ({ currentOption, options, ...rest }: MenuState) => {
            const newOption = currentOption === 1 ? options.length : currentOption - 1;
            return { currentOption: newOption, options, ...rest };
        },
        ENTER: (state: MenuState, operations: TerminalStateOperations) => {
            const opt = state.options[state.currentOption-1];
            return operations.loadView(new MenuView([`${opt}1`, `${opt}2`]));
        }
    }

    constructor(options: string[]) {
        this.initialState = {
            currentOption: 1,
            options
        }
    }

    render({ options, currentOption }: MenuState): void {
        terminal.moveTo(1, 1);
        terminal.eraseDisplayBelow();
        for (let i = 0; i < options.length; i++) {
            const isCurrent = i + 1 == currentOption;
            const lineText = `> ${options[i]}`;
            if (isCurrent) {
                terminal.bgBrightBlue(lineText);
            } else {
                terminal(lineText);
            }
            terminal.nextLine(1);
        }
    }
}