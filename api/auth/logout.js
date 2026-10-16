import { route } from '../../lib/http.js';
import { endSession } from '../../lib/auth.js';

export default route({
  async POST(req, res) {
    endSession(res);
    return { ok: true };
  },
});
