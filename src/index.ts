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
    | 'patch' | 'PATCH';

/**
 * 请求配置类型
 */
export type FRequestConfig<T> = {
    /**
     * 基于baseURL的请求地址
     */
    url: string | URL,
    /**
     * 请求头
     */
    headers?: Record<string, string> | Headers,
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
    /**
     * 跨域是否携带cookie
     */
    withCredentials?: boolean,
    /**
     * 超时时间
    */
    timeout?: number,
}

/**
 * 响应类型
 */
export type FResponse<R, T> = {
    /**
     * HTTP响应码
     */
    status: number,
    /**
     * HTTP响应信息
     */
    statusText: string,
    /**
     * 响应头
     */
    headers: Record<string, string>,
    /**
     * 请求的配置
     */
    config: FRequestConfig<T>
} & ({
    /**
     * 响应数据
     * json自动解析
     */
    data: R,
    type: "json"
} | {
    /**
     * 响应数据
     * 其他类型，保留原始Response
     */
    data: Response,
    type: "other"
});

/**
 * 初始化配置类型
 */
export interface InitConfig extends Omit<FRequestConfig<any>, "url" | "method" | "data"> {
}
/**
 * Fexios类
 * T: 传输数据类型
 * R: 响应数据类型
 */
class Fexios<T = any, R = any> {
    // 没有请求数据
    public get!: (url: string | URL ,request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;
    public delete!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;
    public head!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;
    public options!: (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;
    // 有请求数据
    public post!: (url: string | URL, data?: T, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;
    public put!: (url: string | URL, data?: T, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;
    public patch!: (url: string | URL, data?: T, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => Promise<FResponse<R, T>>;

    public defaults: InitConfig;
    public interceptors: { request: InterceptorManager<FRequestConfig<T>>, response: InterceptorManager<FResponse<R, T>> }

    constructor(initConfig: InitConfig) {
        this.defaults = initConfig;
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };

        const withDataMethods: Method[] = ['post', 'put', 'patch'];
        withDataMethods.forEach(method => {
            (this as any)[method] = async (url: string | URL, data?: T, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => {
                const requestConfig: FRequestConfig<T> = {
                    ...request,
                    url: url,
                    method: method.toUpperCase() as Method,
                    data: data
                };
                return this.request(requestConfig);
            };
        });

        const withoutDataMethods: Method[] = ['get', 'delete', 'head', 'options'];
        withoutDataMethods.forEach(method => {
            (this as any)[method] = async (url: string | URL, request?: Omit<FRequestConfig<T>, "url" | "method" | "data">) => {
                const requestConfig: FRequestConfig<T> = {
                    ...request,
                    url: url,
                    method: method.toUpperCase() as Method
                };
                return this.request(requestConfig);
            };
        });
    }

    public async request(config: FRequestConfig<T>): Promise<FResponse<R, T>> {
        config.headers = config.headers || {};
        const mergedRequest: FRequestConfig<T> = {
            ...this.defaults,
            ...config,
            headers: {
                ...this.defaults.headers,
                ...config.headers
            }
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

        return promise as unknown as Promise<FResponse<R, T>>;
    }
}

export default Fexios;