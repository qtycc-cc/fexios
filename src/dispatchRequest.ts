import type { FRequestConfig, FResponse } from "./index";

export default async function dispatchRequest<R, T>(config: FRequestConfig<T>) {
    const rowResponse = await fetch(new URL(config.url, config.baseURL), {
        method: config.method,
        headers: config.headers,
        body: config.data ? JSON.stringify(config.data) : undefined,
    });

    const contentType = rowResponse.headers.get('Content-Type') || '';
    let responseData;
    if (contentType.includes("application/json")) {
        responseData = await rowResponse.json(); // 自动转json
    } else {
        responseData = rowResponse; // 暂不处理
    }

    const headers: Record<string, string> = {};
    rowResponse.headers.forEach((value, key) => {
        headers[key] = value;
    });

    const response: FResponse<R, T> = {
        status: rowResponse.status,
        statusText: rowResponse.statusText,
        type: contentType.includes("application/json") ? "json" : "other",
        data: responseData,
        headers: headers,
        config: config
    };

    return response;
}