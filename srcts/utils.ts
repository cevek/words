export function getFieldName(fn:(_:any)=>any):string {
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

    getBy(field:string, value:string | number):T {
        if (typeof this.indexUnique == 'undefined' || typeof this.indexUnique[field] == 'undefined') {
            this.createIndex(field, true);
        }
        return this.indexUnique[field][value] || null;
    }

    getById(value:string | number):T {
        if (typeof this.indexUnique == 'undefined' || typeof this.indexUnique['id'] == 'undefined') {
            this.createIndex('id', true);
        }
        return this.indexUnique['id'][value] || null;
    }

    getAllBy(field:string, value:string | number):T[] {
        if (typeof this.index == 'undefined' || typeof this.index[field] == 'undefined') {
            this.createIndex(field, false);
        }
        return this.index[field][value] || [];
    }

    getIndexMap(field:string) {
        if (typeof this.index != 'undefined' && typeof this.index[field] != 'undefined') {
            return this.index[field].$keys;
        }
        if (typeof this.indexUnique == 'undefined' || typeof this.indexUnique[field] == 'undefined') {
            this.createIndex(field, true);
        }
        return this.indexUnique[field].$keys;
    }

    map() {
        return new Store<T>(super.map.apply(this, arguments));
    }

    filter() {
        return new Store<T>(super.filter.apply(this, arguments));
    }

    concat() {
        return new Store<T>(super.concat.apply(this, arguments));
    }

    slice() {
        return new Store<T>(super.slice.apply(this, arguments));
    }
}
