export interface Handler<T> {
    onFulfilled?: ((value: T) => T | Promise<T>),
    onRejected?: ((error: any) => any)
}

class InterceptorManager<T> {
    public handlers: (Handler<T> | undefined)[];
    constructor() {
        this.handlers = [];
    }

    public use(fulfilled?: ((value: T) => T | Promise<T>), rejected?: ((error: any) => any)) {
        this.handlers.push({
            onFulfilled: fulfilled,
            onRejected: rejected,
        });
        return this.handlers.length - 1;
    }

    public eject(id: number) {
        if (this.handlers[id]) {
            this.handlers[id] = undefined;
        }
    }

    public clear() {
        if (this.handlers) {
            this.handlers = [];
        }
    }

    public forEach(fn: (value: Handler<T>) => any) {
        this.handlers.forEach(handler => {
            if (handler) {
                fn(handler);
            }
        });
    }
}

export default InterceptorManager;