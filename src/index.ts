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
    public defaults: InitConfig;
    public interceptors: { request: InterceptorManager<FRequestConfig<T>>, response: InterceptorManager<FResponse<T>> }

    constructor(initConfig: InitConfig) {
        this.defaults = initConfig;
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };
    }

    public async request(config: FRequestConfig<T>) : Promise<FResponse<T>> {
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

    public async get(url: string | URL, request: Omit<FRequestConfig<T>, "url" | "method">) {
        const getRequest: FRequestConfig<T> = {
            ...request,
            url: url,
            method: "GET"
        };
        return this.request(getRequest);
    }

    public async post(url: string | URL, request: Omit<FRequestConfig<T>, "url" | "method">) {
        const postRequest: FRequestConfig<T> = {
            ...request,
            url: url,
            method: "POST"
        };
        return this.request(postRequest);
    }

    public async delete(url: string | URL, request: Omit<FRequestConfig<T>, "url" | "method">) {
        const deleteRequest: FRequestConfig<T> = {
            ...request,
            url: url,
            method: "DELETE"
        };
        return this.request(deleteRequest);
    }

    public async put(url: string | URL, request: Omit<FRequestConfig<T>, "url" | "method">) {
        const putRequest: FRequestConfig<T> = {
            ...request,
            url: url,
            method: "PUT"
        };
        return this.request(putRequest);
    }
}

export default Fexios;