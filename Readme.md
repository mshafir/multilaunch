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
        "startedWhen": "Server ready at"
    },
    {
        "name": "Start Frontend",
        "command": "rush start-frontend",
        "cwd": "./frontend",
        "startedWhen": "Compiled successfully!"
    }
]
```

When started, usage is fairly self-explanatory:

- Up/Down to navigate
- Enter to start/restart a process
- Ctrl+C to stop a process
- Esc to quit multilaunch (and stop underlying processes)
