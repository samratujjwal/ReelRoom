const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
export async function apiRequest(endpoint, method = 'GET', body, token) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json();
        if (!res.ok) {
            return {
                success: false,
                error: data.message || data.error || `Error ${res.status}: ${res.statusText}`,
            };
        }
        return data;
    }
    catch (err) {
        return {
            success: false,
            error: err.message || 'Network request failed. Ensure backend is running.',
        };
    }
}
// Helper REST methods
export const apiService = {
    // Auth
    register: (payload) => apiRequest('/auth/register', 'POST', payload),
    login: (payload) => apiRequest('/auth/login', 'POST', payload),
    getCurrentUser: (token) => apiRequest('/auth/me', 'GET', undefined, token),
    // Rooms
    createRoom: (payload, token) => apiRequest('/rooms', 'POST', payload, token),
    getRoom: (roomId) => apiRequest(`/rooms/${roomId}`, 'GET'),
    listRooms: () => apiRequest('/rooms', 'GET'),
    listMyRooms: (userId) => apiRequest(`/rooms/my-rooms?userId=${userId}`, 'GET'),
    deleteRoom: (roomId, hostUserId, token) => apiRequest(`/rooms/${roomId}`, 'DELETE', { hostUserId }, token),
    getHealth: () => apiRequest('/health', 'GET'),
};
