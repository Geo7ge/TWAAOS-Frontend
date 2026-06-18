export const useApi = () => {
  const API_URL = "http://127.0.0.1:8000";

  const apiCall = async (
    endpoint: string,
    method: string = "GET",
    body?: object,
  ) => {
    try {
      const token = useCookie("token").value;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  return {
    apiCall,
    get: (endpoint: string) => apiCall(endpoint, "GET"),
    post: (endpoint: string, body: object) => apiCall(endpoint, "POST", body),
    put: (endpoint: string, body: object) => apiCall(endpoint, "PUT", body),
    delete: (endpoint: string) => apiCall(endpoint, "DELETE"),
  };
};
