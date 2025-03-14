export default function useUtil() {
    function normalizeHeaders(headers: Record<string, string> | Headers = {}): Record<string, string> {
        if (headers instanceof Headers) {
            const normalized: Record<string, string> = {};
            headers.forEach((value, key) => {
                normalized[key] = value;
            });
            return normalized;
        }
        return headers;
    }

    function deepMerge<T extends Record<string, any>>(target: T, source: T): T {
        const result: any = { ...target };

        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (
                    typeof target[key] === "object" &&
                    typeof source[key] === "object" &&
                    target[key] !== null &&
                    source[key] !== null
                ) {
                    result[key] = deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    return {
        normalizeHeaders,
        deepMerge
    };
}
