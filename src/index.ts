import dispatchRequest from "./dispatchRequest";
import InterceptorManager from "./InterceptorManager";

/**
 * 请求方法类型
 */
export type Method =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'purge' | 'PURGE'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK';

/**
 * 请求配置类型
 */
export interface FRequestConfig<T> {
    /**
     * 基于baseURL的请求地址
     */
    url: string | URL,
    /**
     * 请求头
     */
    headers?: Record<string, string>,
    /**
     * 请求方法
     */
    method: Method,
    /**
     * baseURL
     */
    baseURL?: string | URL,
    /**
     * 传输数据
     */
    data?: T,
}

/**
 * 响应类型
 */
export interface FResponse<T> {
    /**
     * HTTP响应码
     */
    status: number,
    /**
     * HTTP响应信息
     */
    statusText: string,
    /**
     * 响应数据
     */
    data: any,
    /**
     * 响应头
     */
    headers: Record<string, string>,
    /**
     * 请求的配置
     */
    config: FRequestConfig<T>,
}

/**
 * 初始化配置类型
 */
export interface InitConfig {
    baseURL: string | URL,
    headers: Record<string, string>
}

class Fexios<T> {
    public get!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public post!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public delete!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public put!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public head!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public options!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public patch!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public purge!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public link!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;
    public unlink!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => Promise<FResponse<T>>;

    public defaults: InitConfig;
    public interceptors: { request: InterceptorManager<FRequestConfig<T>>, response: InterceptorManager<FResponse<T>> }

    constructor(initConfig: InitConfig) {
        this.defaults = initConfig;
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };

        const methods: Method[] = ['get', 'post', 'delete', 'put', 'head', 'options', 'patch', 'purge', 'link',  'unlink'];
        methods.forEach(method => {
            (this as any)[method] = async (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method">) => {
                const requestConfig: FRequestConfig<T> = {
                    ...request,
                    url: url,
                    method: method.toUpperCase() as Method
                };
                return this.request(requestConfig);
            };
        });
    }

    public async request(config: FRequestConfig<T>): Promise<FResponse<T>> {
        const mergedRequest: FRequestConfig<T> = {
            ...config,
            headers: { ...this.defaults.headers, ...config.headers },
            baseURL: config.baseURL || this.defaults.baseURL
        };

        let chain: (
            ((value: FRequestConfig<T>) => FRequestConfig<T> | Promise<FRequestConfig<T>>) |
            ((error: any) => any) |
            undefined
        )[] = [dispatchRequest, undefined];
        this.interceptors.request.forEach((interceptor) => {
            interceptor.onFulfilled
            chain.unshift(interceptor.onFulfilled, interceptor.onRejected);
        })
        this.interceptors.request.forEach((interceptor) => {
            chain.push(interceptor.onFulfilled, interceptor.onRejected);
        })

        let i = 0;
        let len = chain.length;
        let promise = Promise.resolve(mergedRequest);
        while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
        }

        return promise as unknown as Promise<FResponse<T>>;
    }
}

export default Fexios;