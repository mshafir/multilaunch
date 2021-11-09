import { ChildProcess, spawn } from "child_process";
import { terminal, truncateString } from "terminal-kit";
import { TerminalKeyActions, TerminalStateOperations, TerminalView } from "./TerminalView";
import { padString } from "./utils/pad-string";
import { terminateProcess } from "./utils/terminate-process";

export interface MainViewState {
    selectedCommandId: number;
    log: string[];
}

export interface LauncherConfig {
    name: string;
    command: string;
    cwd: string;
    startedWhen: string;
}

interface LaunchState extends LauncherConfig {
    process?: ChildProcess;
    log?: string[];
    status?: string;
}

export class MainView implements TerminalView<MainViewState> {
    private launches: LaunchState[];
    initialState: MainViewState;

    keyEvents: TerminalKeyActions<MainViewState> = {
        UP: async ({ selectedCommandId, ...rest}) => {
            let newId = selectedCommandId === 0 ? this.launches.length - 1 : selectedCommandId - 1;
            return { 
                ...rest,
                selectedCommandId: newId, 
                log: this.launches[newId].log ?? []
            };
        },
        DOWN: async ({ selectedCommandId, ...rest }) => {
            let newId = selectedCommandId === this.launches.length - 1 ? 0 : selectedCommandId + 1;
            return {
                ...rest,
                selectedCommandId: newId,
                log: this.launches[newId].log ?? []
            };
        },
        ENTER: async (state, operations) => {
            const curProcess = this.launches[state.selectedCommandId];
            this.launch(curProcess, operations);
            return state;
        },
        CTRL_C: async (state) => {
            const curProcess = this.launches[state.selectedCommandId];
            if (!curProcess.process) return state;
            await terminateProcess(curProcess.process.pid);
            curProcess.status = "Stopped";
            curProcess.process = undefined;
            return {
                ...state,
                log: [...state.log, "", "Process was stopped, to restart, press ENTER"]
            };
        },
    };

    constructor(config: LauncherConfig[]) {
        this.initialState = {
            selectedCommandId: 0,
            log: []
        };
        this.launches = config;
    }

    launch(state: LaunchState, operations: TerminalStateOperations<MainViewState>) {
        state.status = "Starting";
        const appendLog = (log: string[]) => {
            state.log = [...(state.log ?? []), ...log];
            if (log.some(l => l.includes(state.startedWhen))) {
                state.status = "Running";
            }
            operations.updateState((oldState: MainViewState) => {
                if (this.launches[oldState.selectedCommandId] === state) {
                    return {
                        ...oldState,
                        log: state.log ?? []
                    }
                }
                return oldState;
            })
        }
        appendLog([`running ${state.command} from ${state.cwd}`]);
        const cmdparts = state.command.split(' ');
        const bin = cmdparts[0];
        const args = cmdparts.slice(1);
        const subproc = spawn(bin, args, {
            cwd: state.cwd
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
            appendLog([`${state.command} exited with code ${code}`]);
            state.status = code === 0 ? "Finished" : "Failed";
        });
        state.process = subproc;
    }

    render(state: MainViewState): void {
        terminal.clear();

        const SIDEBAR_WIDTH = 20;

        const curCommand = this.launches[state.selectedCommandId];

        // render the header
        terminal.moveTo(1, 1);
        terminal(`^b${padString("Commands", SIDEBAR_WIDTH)}^:│ ^b${curCommand.name} Log^:\n`);
        terminal('─'.repeat(SIDEBAR_WIDTH) + '┼' + '─'.repeat(terminal.width - SIDEBAR_WIDTH - 1) + '\n');

        // render the commands on the left side
        for (let i=0;i < this.launches.length; i++) {
            const launch = this.launches[i];
            if (state.selectedCommandId === i) {
                terminal.white();
            } else {
                terminal.grey();
            }
            terminal(padString(launch.name + " ", SIDEBAR_WIDTH));
            terminal.defaultColor();
            terminal.nextLine(1);
            terminal.italic()
            if (launch.status) {
                const txt = `  ${launch.status}`;
                if (launch.status === 'Running') {
                    terminal.green(txt);
                } else if (launch.status === "Starting") {
                    terminal.yellow(txt);
                } else if (launch.status === "Failed") {
                    terminal.red(txt);
                } else if (launch.status === "Stopped") {
                    terminal.red(txt);
                } else {
                    terminal.grey(txt);
                }
            }
            terminal.styleReset();
            terminal.nextLine(1);
            terminal('─'.repeat(SIDEBAR_WIDTH));
            terminal.nextLine(1);
        }

        // render the divider
        const START_POS = 3;
        for (let i = START_POS;i<=terminal.height;i++) {
            terminal.moveTo(SIDEBAR_WIDTH + 1, i);
            terminal('│');
        }

        // render the logs
        let linePos = START_POS;
        let log = state.log.length === 0 ?
            [`Command '${curCommand.command}' has not yet been run, to start press ENTER`] : state.log;

        // truncate the log to the available height
        const numLines = terminal.height - START_POS;
        const start = Math.max(log.length - numLines, 0);
        log = log.slice(start);
        for (const line of log) {
            terminal.moveTo(SIDEBAR_WIDTH + 3, linePos);
            terminal(truncateString(line, terminal.width - SIDEBAR_WIDTH - 2));
            linePos += 1;
        }

        terminal.moveTo(0,terminal.height);
        terminal(' ESC to quit');
        terminal.moveTo(terminal.width, terminal.height);
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