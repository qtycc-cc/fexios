interface Handler {
    fulfilled: Function,
    rejected: Function
}

class InterceptorManager {
    private handlers: (Handler | null)[];
    constructor() {
        this.handlers = [];
    }

    public use(fulfilled: Function, rejected: Function) {
        this.handlers.push({
            fulfilled,
            rejected,
        });
        return this.handlers.length - 1;
    }

    public eject(id: number) {
        if (this.handlers[id]) {
            this.handlers[id] = null;
        }
    }

    public clear() {
        if (this.handlers) {
            this.handlers = [];
        }
    }

    public forEach(fn: Function) {
        this.handlers.forEach(handler => {
            if (handler !== null) {
                fn(handler);
            }
        });
    }
}

export default InterceptorManager;