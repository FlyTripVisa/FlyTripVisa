javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // এআই চ্যাট হ্যান্ডেলিং
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { prompt } = await request.json();
      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', { prompt });
      return Response.json({ response: response.response });
    }

    // ডাটাবেস অপারেশন
    if (url.pathname === '/api/apply' && request.method === 'POST') {
      const body = await request.json();
      await env.DB.prepare("INSERT INTO applications (full_name, email, destination) VALUES (?,?,?)")
                .bind(body.name, body.email, body.dest).run();
      return Response.json({ status: "success" });
    }

    // স্ট্যাটিক ফাইল রিটার্ন
    return fetch(request);
  }
};