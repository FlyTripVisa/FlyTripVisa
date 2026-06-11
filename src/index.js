javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // ১. এআই চ্যাট হ্যান্ডেলিং
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const { prompt } = await request.json();
        
        if (!prompt) return Response.json({ error: "Prompt is required" }, { status: 400 });

        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', { prompt });
        return Response.json({ response: response.response });
      }

      // ২. ডাটাবেস অপারেশন (বুকিং/ভিসা এপ্লিকেশন)
      if (url.pathname === '/api/apply' && request.method === 'POST') {
        const body = await request.json();
        
        if (!body.name || !body.email || !body.dest) {
          return Response.json({ error: "All fields are required" }, { status: 400 });
        }

        await env.DB.prepare(
          "INSERT INTO applications (full_name, email, destination) VALUES (?,?,?)"
        )
        .bind(body.name, body.email, body.dest)
        .run();
        
        return Response.json({ status: "success", message: "Application submitted successfully" });
      }

      // ডিফল্ট রেসপন্স
      return new Response("API endpoint not found", { status: 404 });

    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }
};
