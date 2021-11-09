export function padString(str: string, len: number) {
    if (str.length > len) {
        return str.slice(0, len);
    } else {
        return str + ' '.repeat(len - str.length);
    }
}