import { handleSearchRequest } from './solver.mjs';

self.addEventListener('message', (event) => {
  const result = handleSearchRequest(event.data);
  self.postMessage(result);
});
