
export type StateUpdateFunction<S> = (state: S, operations: TerminalStateOperations<S>) => Promise<S>

export type TerminalKeyActions<S> = { [k: string]: StateUpdateFunction<S>; };

export type StateUpdate<S> = (oldState: S) => S;

export interface TerminalView<S> {
    initialState: S;
    keyEvents: TerminalKeyActions<S>;
    startup?(operations: TerminalStateOperations<S>): Promise<void>;
    render(state: S): void;
    cleanup?(): Promise<void>;
}

export interface TerminalStateOperations<S=any> {
    updateState(state: S | StateUpdate<S>): S;
    loadView(view: TerminalView<any>): Promise<any>;
}