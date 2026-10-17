import { createPayment } from "@/lib/mollie";
import { newOrderId, parseCheckout } from "@/lib/orders";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json({ error: "Check the form and try again." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Check the form and try again." }, { status: 400 });
  }

  const parsed = parseCheckout(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error, fields: parsed.fields }, { status: 400 });
  }

  try {
    const payment = await createPayment(newOrderId(), parsed);
    if ("error" in payment) {
      const status = payment.error === "Payments are not configured." ? 503 : 502;
      return Response.json({ error: payment.error }, { status });
    }
    return Response.json({ checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    console.error("checkout failed", error instanceof Error ? error.name : "error");
    return Response.json({ error: "Checkout could not start. Try again." }, { status: 502 });
  }
}
