import InterceptorManager from "./InterceptorManager";

export interface FRequest {
    url: string,
    headers?: Record<string, string>,
    method: "GET" | "POST",
    baseURL?: string,
    data?: object,
}

export interface FResponse {
    status: number,
    statusText: string,
    data: object,
    headers: Record<string, string>,
    request: FRequest,
}

class Fexios {
    private baseURL: string;
    private headers: Record<string, string>;
    private interceptors: { request: InterceptorManager, response: InterceptorManager }

    constructor(baseURL: string, headers: Record<string, string> = { 'Content-Type': 'application/json' }) {
        this.baseURL = baseURL;
        this.headers = headers;
        this.interceptors = {
            request: new InterceptorManager(),
            response: new InterceptorManager()
        };
    }

    public async request(request: FRequest) {
        try {
            const mergedRequest: FRequest = {
                ...request,
                headers: { ...this.headers, ...request.headers },
                baseURL: request.baseURL || this.baseURL
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
            if (contentType.includes("json")) {
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
}

export default Fexios;