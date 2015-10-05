export function getFieldName(fn:(_:any)=>any):string {
    const matches = fn.toString().replace(/\s+/g, '').match(/\.([^.]+);}$/);
    if (!matches) {
        throw 'fn does not return a field';
    }
    return matches[1];
}
