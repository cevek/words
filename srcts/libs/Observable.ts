export type Listener = ()=>void;
export class Observable {
    private listeners:Listener[] = null;
    private waitPromise:Promise<void> = null;

    //lazy init
    private _listenersSignal:Observable = null;
    get listenersSignal() {
        if (!this._listenersSignal) {
            this._listenersSignal = new Observable();
        }
        return this._listenersSignal;
    }

    getListeners() {
        return this.listeners.slice();
    }

    listen(listener:Listener) {
        if (!this.listeners) {
            this.listeners = [];
        }
        if (this.listeners.indexOf(listener) == -1) {
            this.listeners.push(listener);
        }
        if (this._listenersSignal) {
            this._listenersSignal.notify();
        }
        return this;
    }

    unlisten(listener:Listener) {
        var pos = this.listeners.indexOf(listener);
        if (pos == -1) {
            throw "Listener not found";
        }
        this.listeners.splice(pos, 1);
        if (this._listenersSignal) {
            this._listenersSignal.notify();
        }
        return this;
    }

    notify() {
        if (this.listeners && this.listeners.length && !this.waitPromise) {
            this.waitPromise = Promise.resolve().then(() => {
                this.notifySync();
            });
        }
        return this.waitPromise;
    }

    notifySync() {
        this.waitPromise = null;
        if (this.listeners) {
            for (var i = 0; i < this.listeners.length; i++) {
                var listener = this.listeners[i];
                listener();
            }
        }
        return this;
    }
}