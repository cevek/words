function getFieldName(fn:(_:any)=>any):string {
    const matches = fn.toString().replace(/\s+/g, '').match(/\.([^.]+);}$/);
    if (!matches) {
        throw 'fn does not return a field';
    }
    return matches[1];
}
interface Index<T> {
    [index: string]: {
        [index: string]: any;
        $keys: string[]
    }
}
export class Store<T> {
    private index:Index<T>;
    private indexUnique:Index<T>;
    public items:T[];

    constructor(array:T[] = []) {
        this.items = array;
        if (array && !Array.isArray(array)) {
            throw new Error('Store argument type is not Array: ' + JSON.stringify(array));
        }
    }

    public static inline(target:any, methodName:string):any {
        console.log(target, methodName);
        var fn = target[methodName];

        const code = fn.toString();
        const matches = code.match(/^function\s*\(\w+\)\s*\{\s*return this.get(All)?By\(function\s*\(\w+\)\s*\{\s*return \w+\.(\w+);\s*\},\s*\w+\);\s*\}$/);
        if (!matches) {
            throw 'Incorrect method';
        }
        const isUnique = !matches[1];
        const indexName = isUnique ? 'indexUnique' : 'index';
        const field = matches[2];
        target[methodName] = eval(`
            (function(value){
                if (typeof this.${indexName} == "undefined" || typeof this.${indexName}.${field} == "undefined") {
                    this.createIndex(${field}, ${isUnique});
                }
                return this.${indexName}.${field}[value] || null;
            })`);
    }

    private createIndex(field:string, isUnique:boolean) {
        let index:Index<T>;
        if (isUnique) {
            if (!this.indexUnique) {
                Object.defineProperty(this, 'indexUnique', {value: {}});
            }
            index = this.indexUnique;
        } else {
            if (!this.index) {
                Object.defineProperty(this, 'index', {value: {}});
            }
            index = this.index;
        }

        if (typeof index[field] == 'undefined') {
            index[field] = {$keys: []};
        }
        const indexKeys = index[field].$keys;
        const indexFieldMap = index[field];

        for (let i = 0; i < this.items.length; i++) {
            const item:any = this.items[i];
            if (typeof item == 'undefined' || typeof item[field] == 'undefined') {
                throw new Error(`Array[${i}].${field} value is undefined. Array item: ${JSON.stringify(item)}`);
            }
            const value = item[field];
            if (typeof indexFieldMap[value] == 'undefined') {
                indexFieldMap[value] = isUnique ? item : new Store<T>();
                indexKeys.push(value);
            }
            if (!isUnique) {
                indexFieldMap[value].push(item);
            }
        }
    }

    @Store.inline
    getById(value:string | number):T {
        return this.getBy((it:any)=>it.id, value);
    }

    protected getBy(fn:(it:T)=>string | number, value:string | number):T {
        throw new Error('Method is not inline');
    }

    protected getAllBy(fn:(it:T)=>string | number, value:string | number):T[] {
        throw new Error('Method is not inline');
    }

    protected getIndexMap(field:string) {
        if (typeof this.index != 'undefined' && typeof this.index[field] != 'undefined') {
            return this.index[field].$keys;
        }
        if (typeof this.indexUnique == 'undefined' || typeof this.indexUnique[field] == 'undefined') {
            this.createIndex(field, true);
        }
        return this.indexUnique[field].$keys;
    }

    map<U>(cb:(value:T, index:number, array:T[]) => U, thisArg?:any) {return this.items.map(cb, thisArg)}

    filter(cb:(value:T, index:number, array:T[]) => boolean, thisArg?:any) {return this.items.filter(cb, thisArg)}

    slice(start?:number, end?:number) {return this.items.slice(start, end)}

    forEach(cb:(value:T, index:number, array:T[]) => void, thisArg?:any) {return this.items.forEach(cb, thisArg)}

    push(...items:T[]) {return this.items.push(...items)}

    pop() {return this.items.pop()}

    join(separator?:string) {return this.items.join(separator)}

    reverse() {return this.items.reverse()}

    shift() {return this.items.shift()}

    sort(compareFn?:(a:T, b:T) => number) {return this.items.sort(compareFn)}

    splice(start:number, deleteCount?:number, ...items:T[]) {return this.items.splice(start, deleteCount, ...items)}

    unshift(...items:T[]) {return this.items.unshift(...items)}

    indexOf(searchElement:T, fromIndex?:number) {return this.items.indexOf(searchElement, fromIndex)}

    lastIndexOf(searchElement:T, fromIndex?:number) {return this.items.lastIndexOf(searchElement, fromIndex)};

    every(cb:(value:T, index:number, array:T[]) => boolean, thisArg?:any) {return this.items.every(cb, thisArg)}

    some(cb:(value:T, index:number, array:T[]) => boolean, thisArg?:any) {return this.items.some(cb, thisArg)}

    reduce(cb:(prev:T, cur:T, curIndex:number, array:T[]) => T, init?:T):T;
    reduce<U>(cb:(prev:U, cur:T, curIndex:number, array:T[]) => U, init:U) {return this.items.reduce(cb, init)}

    reduceRight(cb:(prev:T, cur:T, curInd:number, array:T[]) => T, init?:T):T;
    reduceRight<U>(cb:(prev:U, cur:T, curInd:number, array:T[]) => U, init:U) {return this.items.reduceRight(cb, init)}
}
