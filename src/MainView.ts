import { ChildProcess, spawn } from "child_process";
import { terminal, truncateString } from "terminal-kit";
import { MouseActions, TerminalActions, TerminalView } from "./TerminalView";
import { padString } from "./utils/pad-string";
import { terminateProcess } from "./utils/terminate-process";

export interface LauncherConfig {
    name: string;
    command: string;
    cwd: string;
    startedWhen?: string;
}

interface LaunchState extends LauncherConfig {
    process?: ChildProcess;
    log?: string[];
    status?: string;
}


const HEADER_SIZE = 2;
const SIDEBAR_WIDTH = 30;
const SCROLL_AMOUNT = 1;

export class MainView implements TerminalView {
    private launches: LaunchState[];
    private selectedCommandId = 0;
    private currentLog: string[] = [];
    private logScrollOffset = 0;

    keyEvents: TerminalActions = {
        UP: async () => {
            let newId = this.selectedCommandId === 0 ? this.launches.length - 1 : this.selectedCommandId - 1;
            this.selectedCommandId = newId;
            this.currentLog = this.launches[newId].log ?? [];
            this.logScrollOffset = 0;
            return true;
        },
        DOWN: async () => {
            let newId = this.selectedCommandId === this.launches.length - 1 ? 0 : this.selectedCommandId + 1;
            this.selectedCommandId = newId;
            this.currentLog = this.launches[newId].log ?? [];
            this.logScrollOffset = 0;
            return true;
        },
        ENTER: async () => {
            const curProcess = this.launches[this.selectedCommandId];
            this.launch(curProcess);
            this.logScrollOffset = 0;
            return true;
        },
        CTRL_C: async () => {
            const curProcess = this.launches[this.selectedCommandId];
            if (!curProcess.process) return;
            await terminateProcess(curProcess.process.pid);
            curProcess.status = "Stopped";
            curProcess.process = undefined;
            this.currentLog = [...this.currentLog, "", "Process was stopped, to restart, press ENTER"];
            this.logScrollOffset = 0;
            return true;
        },
        ESCAPE: async (_data, operations) => {
            await operations.terminate();
        }
    };

    mouseEvents: TerminalActions<MouseActions> = {
        MOUSE_WHEEL_UP: async () => {
            let newScrollOffset = this.logScrollOffset;
            if (this.logScrollOffset + SCROLL_AMOUNT >= this.currentLog.length) {
                newScrollOffset = this.currentLog.length;
            } else {
                newScrollOffset += SCROLL_AMOUNT;
            }
            if (newScrollOffset !== this.logScrollOffset) {
                this.logScrollOffset = newScrollOffset;
                this.renderCurrentLog();
            }
        },
        MOUSE_WHEEL_DOWN: async () => {
            let newScrollOffset = this.logScrollOffset;
            if (this.logScrollOffset - SCROLL_AMOUNT < 0) {
                newScrollOffset = 0;
            } else {
                newScrollOffset -= SCROLL_AMOUNT;
            }
            if (newScrollOffset !== this.logScrollOffset) {
                this.logScrollOffset = newScrollOffset;
                this.renderCurrentLog();
            }
        }
    }

    constructor(config: LauncherConfig[]) {
        this.launches = config;
    }

    appendLog(state: LaunchState, log: string[]) {
        if (log.length === 0) return;
        state.log = [...(state.log ?? []), ...log];
        if (!state.status || state.status === "Starting") {
            if (!state.startedWhen || log.some(l => l.includes(state.startedWhen ?? ''))) {
                state.status = "Running";
                this.renderSidebar();
                this.resetCursor()
            }
        }
        if (this.launches[this.selectedCommandId] === state) {
            this.currentLog = state.log ?? [];
            this.renderCurrentLog();
        }
    }

    launch(state: LaunchState) {
        state.status = "Starting";
        const appendLog = (log: string[]) => {
            this.appendLog(state, log);
        }
        appendLog([`running ${state.command} from ${state.cwd}`]);
        const cmdparts = state.command.split(' ');
        const bin = cmdparts[0];
        const args = cmdparts.slice(1);
        process.env.FORCE_COLOR = 'true';
        const subproc = spawn(bin, args, {
            cwd: state.cwd,
            env: process.env,
            shell: true
        });
        const appendData = (data: any) => {
            const dataString = data.toString();
            let lines = dataString.split('\n');
            if (dataString.endsWith('\n')) {
                lines = lines.slice(0, lines.length - 1);
            }
            appendLog(lines);
        }
        subproc.stdout?.on('data', appendData)
        subproc.stderr?.on('data', appendData)
        subproc.on('close', (code) => {
            state.status = code === 0 ? "Finished" : "Failed";
            this.renderSidebar();
            appendLog([`${state.command} exited with code ${code}`]);
            state.process = undefined;
        });
        state.process = subproc;
    }

    renderStatus(status?: string) {
        if (status) {
            const txt = `  ${status}   `;
            if (status === 'Running') {
                terminal.green(txt);
            } else if (status === "Starting") {
                terminal.yellow(txt);
            } else if (status === "Failed") {
                terminal.red(txt);
            } else if (status === "Stopped") {
                terminal.red(txt);
            } else {
                terminal.grey(txt);
            }
        }
    }

    renderCommandOnLeft(launch: LaunchState) {
        if (this.launches[this.selectedCommandId] === launch) {
            terminal.white();
        } else {
            terminal.grey();
        }
        terminal(padString(launch.name + " ", SIDEBAR_WIDTH));
        terminal.defaultColor();
        terminal.nextLine(1);
        terminal.italic()
        this.renderStatus(launch.status);
        terminal.styleReset();
        terminal.nextLine(1);
        terminal('─'.repeat(SIDEBAR_WIDTH));
        terminal.nextLine(1);
    }

    renderSidebar() {
        terminal.moveTo(1, HEADER_SIZE + 1);
        for (let i = 0; i < this.launches.length; i++) {
            const launch = this.launches[i];
            this.renderCommandOnLeft(launch);
        }
        
        // render the divider line
        for (let i = HEADER_SIZE+1; i <= terminal.height; i++) {
            terminal.moveTo(SIDEBAR_WIDTH + 1, i);
            terminal('│');
        }

        terminal.moveTo(0, terminal.height);
        terminal(' ESC to quit');
    }

    renderCurrentLog() {
        const startRow = HEADER_SIZE + 1;
        const startCol = SIDEBAR_WIDTH + 3;

        const curCommand = this.launches[this.selectedCommandId];
        let linePos = startRow;
        let log = this.currentLog.length === 0 ?
            [`Command '${curCommand.command}' has not yet been run, to start press ENTER`] : this.currentLog;
        // truncate the log to the available height
        const numLines = terminal.height - startRow;
        const offset = Math.max(numLines + this.logScrollOffset, numLines);
        const start = Math.max(log.length - offset, 0);
        log = log.slice(start, start + numLines);
        for (const line of log) {
            terminal.moveTo(startCol, linePos);
            terminal.eraseLineAfter();
            terminal(truncateString(line, terminal.width - startCol));
            linePos += 1;
        }
    }

    renderHeader() {
        terminal.moveTo(1, 1);
        const curCommand = this.launches[this.selectedCommandId];
        terminal(`^b${padString("Commands", SIDEBAR_WIDTH)}^:│ ^b${curCommand.name}^:\n`);
        terminal('─'.repeat(SIDEBAR_WIDTH) + '┼' + '─'.repeat(terminal.width - SIDEBAR_WIDTH - 1) + '\n');
    }

    resetCursor() {
        terminal.moveTo(terminal.width, terminal.height);
    }

    render(): void {
        terminal.clear();
        this.renderHeader();
        this.renderSidebar();
        this.renderCurrentLog();
        this.resetCursor();
    }

    async cleanup(): Promise<void> {
        const promises : Promise<void>[] = [];
        for (const launch of this.launches) {
            if (launch.process?.pid) {
                promises.push(terminateProcess(launch.process.pid));
            }
        } 
        await Promise.all(promises);
    }
}