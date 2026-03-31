export interface SafeResponse<T> {
    data?: T;
    error?: string;
    status?: number;
}

/**
 * Defensive Fetch Utility to prevent "Unexpected end of JSON input" crashes.
 */
export async function safeFetch<T>(
    url: string,
    options?: RequestInit
): Promise<SafeResponse<T>> {
    try {
        const res = await fetch(url, options);

        // Read as text first to handle empty responses
        const text = await res.text();

        if (!text) {
            if (!res.ok) {
                return {
                    error: `Empty response with status ${res.status}`,
                    status: res.status
                };
            }
            return { status: res.status };
        }

        try {
            const data = JSON.parse(text);
            if (!res.ok) {
                return {
                    error: data.error || `Error ${res.status}`,
                    data,
                    status: res.status
                };
            }
            return { data, status: res.status };
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw Text:", text);
            return {
                error: "Malformed server response",
                status: res.status
            };
        }
    } catch (err: any) {
        console.error("Fetch failure:", err);
        return { error: err.message || "Network request failed" };
    }
}
