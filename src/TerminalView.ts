
export type ActionFunction = (event: any, operations: GlobalTerminalOperations) => Promise<boolean | void>

export type TerminalActions<K extends string=string> = { [k in K]?: ActionFunction; };

export type MouseActions = 
    'MOUSE_LEFT_BUTTON_PRESSED' | 
    'MOUSE_LEFT_BUTTON_RELEASED' | 
    'MOUSE_RIGHT_BUTTON_PRESSED' | 
    'MOUSE_RIGHT_BUTTON_RELEASED' |
    'MOUSE_MIDDLE_BUTTON_PRESSED' |
    'MOUSE_MIDDLE_BUTTON_RELEASED' |
    'MOUSE_WHEEL_UP' |
    'MOUSE_WHEEL_DOWN' | 
    'MOUSE_OTHER_BUTTON_PRESSED' |
    'MOUSE_OTHER_BUTTON_RELEASED' |
    'MOUSE_BUTTON_RELEASED' |
    'MOUSE_MOTION' |
    'MOUSE_DRAG';

export interface TerminalView {
    keyEvents: TerminalActions;
    mouseEvents: TerminalActions<MouseActions>;
    startup?(operations: GlobalTerminalOperations): Promise<void>;
    render(): void;
    cleanup?(): Promise<void>;
}

export interface GlobalTerminalOperations {
    loadView(view: TerminalView): Promise<void>;
    terminate(): Promise<any>;
}
