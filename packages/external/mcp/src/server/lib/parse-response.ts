export const parseResponse = async (response: Response): Promise<string | object | ArrayBuffer | undefined> => {
    try {
        const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await response.json() as object;
  } else if (contentType.includes('image/')) {
    return await response.arrayBuffer();
  } else {
    return await response.text();
  }
    } catch {
        return undefined;
    }
  
};