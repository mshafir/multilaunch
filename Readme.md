# Multilaunch

This is a utility for launching multiple processes and toggling between them to view their logs.

### Usage:

```
npx multilaunch config.json
```

Example config:

```json5
[
    {
        // name for the command in the sidebar
        "name": "Start Backend", 
        // the shell command to run
        "command": "rush start-backend", 
        // the cwd to run from
        "cwd": "./backend", 
         // if applicable, a string to look for to indicate the process has started up
        "startedWhen": "Server ready at",
        // a section for grouping commands under a section heading, commands still need to be consecutive
        // the section is rendered when it is different from the previous command's section
        "section": "Backend"
    },
    {
        "name": "Start Frontend",
        "command": "rush start-frontend",
        "cwd": "./frontend",
        "startedWhen": "Compiled successfully!",
        "section": "Frontend"
    }
]
```

When started, usage is fairly self-explanatory:

- Up/Down to navigate
- Enter to start/restart a process
- Ctrl+C to stop a process
- D to dump the current log to disk
- Esc to quit multilaunch (and stop underlying processes)

Mouse scroll moves the log up and down, but you mean need to tweak terminal settings for this.
Cmder - under Keys & Macro > Mouse > Send mouse events to console
iTerm2 - Profiles > Terminal > Uncheck 'Save lines to scrollback in alternate screen mode'
