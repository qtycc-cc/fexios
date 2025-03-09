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
            const requestURL = new URL(request.url, request.baseURL ? request.baseURL : this.baseURL);
            if (!request.headers) {
                request.headers = this.headers;
            }

            let chain: Promise<FRequest> = Promise.resolve(request);

            this.interceptors.request.forEach(({ fulfilled, rejected }: {
                fulfilled: (value: FRequest) => FRequest | Promise<FRequest>,
                rejected?: (error: any) => never
            }) => {
                chain = chain.then(fulfilled, rejected);
            });


            const rowResponse = await fetch(requestURL, {
                method: request.method,
                headers: request.headers,
                body: request.data ? JSON.stringify(request.data) : undefined,
            });

            const responseData = await rowResponse.json();

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

            let responseChain: Promise<FResponse> = Promise.resolve(response);
            this.interceptors.response.forEach(({ fulfilled, rejected }: {
                fulfilled: (value: FResponse) => FResponse | Promise<FResponse>,
                rejected?: (error: any) => never
            }) => {
                responseChain = responseChain.then(fulfilled, rejected);
            });

            if (!rowResponse.ok) {
                throw response;
            }
            return await responseChain;
        } catch (error) {
            let errorChain = Promise.reject(error);
            this.interceptors.response.forEach(({ rejected }: { rejected?: (error: any) => never }) => {
                if (rejected) {
                    errorChain = errorChain.catch(rejected);
                }
            });
            return await errorChain;
        }
    }
}

export default Fexios;