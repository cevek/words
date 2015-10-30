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
export class Store<T> extends Array<T> {
    private index:Index<T>;
    private indexUnique:Index<T>;
    public items:T[];

    constructor(array:T[] = []) {
        if (false) {
            super();
        }
        if (array && !Array.isArray(array)) {
            throw new Error('Store argument type is not Array: ' + JSON.stringify(array));
        }
        Object.setPrototypeOf(array, Store.prototype);
        return <any>array;
    }

    public static inline(p: any, da: any): any{

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

        for (let i = 0; i < this.length; i++) {
            const item:any = this[i];
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

    protected getBy<V>(fn:(it:T)=>V, value:string | number):T {
        var field = getFieldName(fn);
        if (typeof this.indexUnique == 'undefined' || typeof this.indexUnique[field] == 'undefined') {
            this.createIndex(field, true);
        }
        return this.indexUnique[field][value] || null;
    }

    protected getAllBy<V>(fn:(it:T)=>V, value:string | number):T[] {
        var field = getFieldName(fn);
        if (typeof this.index == 'undefined' || typeof this.index[field] == 'undefined') {
            this.createIndex(field, false);
        }
        return this.index[field][value] || [];
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

    map<U>(callbackfn:(value:T, index:number, array:T[]) => U,
        thisArg?:any) {return new Store(this.items.map(callbackfn, thisArg))}

    filter(callbackfn:(value:T, index:number, array:T[]) => boolean,
        thisArg?:any) {return new Store(this.items.filter(callbackfn, thisArg))}

    slice(start?:number, end?:number) {return new Store(this.items.slice(start, end))}

    forEach(callbackfn:(value:T, index:number, array:T[]) => void,
        thisArg?:any) {return this.items.forEach(callbackfn, thisArg)}

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

    every(callbackfn:(value:T, index:number, array:T[]) => boolean,
        thisArg?:any) {return this.items.every(callbackfn, thisArg)}

    some(callbackfn:(value:T, index:number, array:T[]) => boolean,
        thisArg?:any) {return this.items.some(callbackfn, thisArg)}

    reduce(callbackfn:(previousValue:T, currentValue:T, currentIndex:number, array:T[]) => T, initialValue?:T):T;
    reduce<U>(callbackfn:(previousValue:U, currentValue:T, currentIndex:number, array:T[]) => U,
        initialValue:U) {return this.items.reduce(callbackfn, initialValue)}

    reduceRight(callbackfn:(previousValue:T, currentValue:T, currentIndex:number, array:T[]) => T, initialValue?:T):T;
    reduceRight<U>(callbackfn:(previousValue:U, currentValue:T, currentIndex:number, array:T[]) => U,
        initialValue:U) {return this.items.reduceRight(callbackfn, initialValue)}
}
