import { HttpStatusError } from "./error";

async function request<Q = object, R = object>(
  method: string,
  url: string,
  body?: Q
): Promise<R> {
  const res = await fetch(url, {
    method,
    headers: body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new HttpStatusError(res.status, await res.text());
  }
  return res.json();
}

export const client = {
  get<T>(url: string): Promise<T> {
    return request("GET", url);
  },
  post<Q = object, R = object>(url: string, body: Q): Promise<R> {
    return request("POST", url, body);
  },
  put<Q = object, R = object>(url: string, body: Q): Promise<R> {
    return request("PUT", url, body);
  },
  delete<Q = object, R = object>(url: string, body: Q): Promise<R> {
    return request("DELETE", url, body);
  },
};
