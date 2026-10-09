const BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('pontovision_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Limpa token se não autorizado
    localStorage.removeItem('pontovision_token');
    localStorage.removeItem('pontovision_refresh_token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {}
    const msg = errorData.message || `Erro ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, Array.isArray(msg) ? msg.join(', ') : msg, errorData);
  }

  // Verifica se é download binário (blob)
  const contentType = response.headers.get('content-type') || '';
  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/vnd') ||
    contentType.includes('text/csv')
  ) {
    return (await response.blob()) as unknown as T;
  }

  return response.json();
}
