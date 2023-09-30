export function resJson(body: object, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

export function resRedirect(url: string, status: number = 302) {
  return new Response(undefined, {
    status,
    headers: {
      location: url,
    },
  });
}
