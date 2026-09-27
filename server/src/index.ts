import { app } from './app.js';
import { ENV } from './config/env.js';
import { heartbeatChatStreams } from './utils/chatEvents.js';

app.listen(ENV.PORT, () => console.log(`KrishiMitra API running on http://localhost:${ENV.PORT}`));

// Keep Server-Sent Event chat connections alive. The client uses SSE for
// realtime message delivery and falls back to normal API refreshes if needed.
setInterval(heartbeatChatStreams, 25000);
