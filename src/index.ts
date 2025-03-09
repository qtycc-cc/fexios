import InterceptorManager from "./InterceptorManager";

export interface FRequest {
    url: string | URL,
    headers?: Record<string, string>,
    method: "GET" | "POST" | "DELETE" | "PUT",
    baseURL?: string | URL,
    data?: any,
}

export interface FResponse {
    status: number,
    statusText: string,
    data: any,
    headers: Record<string, string>,
    request: FRequest,
}

export interface InitConfig {
    baseURL: string | URL,
    headers: Record<string, string>
}

class Fexios {
    public defaults: InitConfig;
    public interceptors: { request: InterceptorManager, response: InterceptorManager }

    constructor(initConfig: InitConfig) {
        this.defaults = initConfig;
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };
    }

    public create(initConfig: Partial<InitConfig>) {
        const config: InitConfig = {
            ...this.defaults,
            ...initConfig
        };
        return new Fexios(config);
    }

    public async request(request: FRequest) {
        try {
            const mergedRequest: FRequest = {
                ...request,
                headers: { ...this.defaults.headers, ...request.headers },
                baseURL: request.baseURL || this.defaults.baseURL
            };

            let chain: Promise<FRequest> = Promise.resolve(mergedRequest);
            this.interceptors.request.forEach(({ fulfilled, rejected }: {
                fulfilled: (value: FRequest) => FRequest | Promise<FRequest>,
                rejected?: (error: any) => never
            }) => {
                chain = chain.then(fulfilled, rejected);
            });

            let processedRequest = await chain;

            const rowResponse = await fetch(new URL(processedRequest.url, processedRequest.baseURL), {
                method: processedRequest.method,
                headers: processedRequest.headers,
                body: processedRequest.data ? JSON.stringify(processedRequest.data) : undefined,
            });

            const contentType = rowResponse.headers.get('Content-Type') || '';
            let responseData;
            if (contentType.includes("application/json")) {
                responseData = await rowResponse.json();
            } else {
                responseData = rowResponse;
            }

            const headers: Record<string, string> = {};
            rowResponse.headers.forEach((value, key) => {
                headers[key] = value;
            });

            let response: FResponse = {
                status: rowResponse.status,
                statusText: rowResponse.statusText,
                data: responseData,
                headers: headers,
                request: request
            };

            let responseChain: Promise<FResponse>;
            if (rowResponse.ok) {
                responseChain = Promise.resolve(response);
            } else {
                responseChain = Promise.reject(response);
            }
            this.interceptors.response.forEach(({ fulfilled, rejected }: {
                fulfilled: (value: FResponse) => FResponse | Promise<FResponse>,
                rejected?: (error: any) => never
            }) => {
                responseChain = responseChain.then(fulfilled, rejected);
            });

            return await responseChain;
        } catch (error) {
            throw error;
        }
    }

    public async get(url: string | URL, request: Omit<FRequest, "url" | "method">) {
        const getRequest: FRequest = {
            ...request,
            url: url,
            method: "GET"
        };
        return this.request(getRequest);
    }

    public async post(url: string | URL, request: Omit<FRequest, "url" | "method">) {
        const postRequest: FRequest = {
            ...request,
            url: url,
            method: "POST"
        };
        return this.request(postRequest);
    }

    public async delete(url: string | URL, request: Omit<FRequest, "url" | "method">) {
        const deleteRequest: FRequest = {
            ...request,
            url: url,
            method: "DELETE"
        };
        return this.request(deleteRequest);
    }

    public async put(url: string | URL, request: Omit<FRequest, "url" | "method">) {
        const putRequest: FRequest = {
            ...request,
            url: url,
            method: "PUT"
        };
        return this.request(putRequest);
    }
}

export default Fexios;