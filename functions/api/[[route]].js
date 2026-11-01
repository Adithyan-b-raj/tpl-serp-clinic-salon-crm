export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // If request is targeting a specific sub-api, delegate to next handler
  if (url.pathname.startsWith('/api/rx') || url.pathname.startsWith('/api/queue') || url.pathname.startsWith('/api/appointments')) {
    return context.next();
  }

  return new Response(JSON.stringify({ 
    service: 'tpl-serp-clinic-salon-crm', 
    status: 'ok', 
    items: [
      {"id":"TK-18","name":"Anjali Krishnan (File #PT-904)","phone":"919847011223","detail":"Cabin 1 (Dr. Sarah) • Carbon Peel • 11:30 AM","status":"IN CABIN NOW","amount":"₹4,500"},
      {"id":"TK-19","name":"Mohammed Faizal (File #PT-905)","phone":"919447022334","detail":"Cabin 2 (Dr. Arvind) • Root Canal Sitting 2 • 12:00 PM","status":"WAITING NEXT","amount":"₹3,200"},
      {"id":"TK-08","name":"Neha Varma (File #PT-882)","phone":"919895033445","detail":"Cabin 1 (Dr. Sarah) • HydraFacial MD Sitting 3/4","status":"COMPLETED // BILLED","amount":"₹3,499"}
    ] 
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120' }
  });
}
