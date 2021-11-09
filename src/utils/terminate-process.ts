import terminate from 'terminate';

export function terminateProcess(pid: number) {
    return new Promise<void>((resolve) => {
        (terminate as any)(pid, (err: any) => {
            err && console.error(err);
            resolve();
        })
    })
}