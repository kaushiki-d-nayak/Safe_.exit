/* Establish one browser workspace before concurrent feature requests. */
(() => {
  let workspace;
  async function send(path, options = {}) {
    let response;
    try {
      response = await fetch('/api/' + path, {
        ...options,
        credentials: 'same-origin', cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError'
        ? 'The connection timed out. Check your network and try again.'
        : 'Unable to connect. Check your internet connection and try again.');
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('The safety backend is unavailable. Please retry shortly.');
    }
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || 'Unable to complete the request. Please retry.'), {status: response.status});
    return data;
  }
  window.safeExitRequest = async (path, options) => {
    if (!workspace) {
      workspace = send('workspace').catch(error => { workspace = null; throw error; });
    }
    await workspace;
    return send(path, options);
  };
})();
