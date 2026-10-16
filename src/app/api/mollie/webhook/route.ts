import { sendMerchantEmail } from "@/lib/email";
import { readPaidOrder } from "@/lib/mollie";
import { appendOrder } from "@/lib/sheet";

const seen = new Set<string>();

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const id = form?.get("id");
  if (typeof id !== "string" || !/^tr_[A-Za-z0-9]+$/.test(id)) {
    return Response.json({ error: "Missing payment id." }, { status: 400 });
  }

  if (seen.has(id)) return new Response(null, { status: 200 });

  const order = await readPaidOrder(id);
  if (order === "ignore") return new Response(null, { status: 200 });
  if (order === "retry") return new Response(null, { status: 500 });

  try {
    const sheet = await appendOrder(order);
    if (!sheet.duplicate) {
      try {
        await sendMerchantEmail(order);
      } catch (error) {
        console.error(
          "merchant email failed",
          order.orderId,
          error instanceof Error ? error.message : "error",
        );
      }
    }
  } catch (error) {
    console.error(
      "sheet append failed",
      order.orderId,
      error instanceof Error ? error.message : "error",
    );
    return new Response(null, { status: 500 });
  }

  seen.add(id);
  return new Response(null, { status: 200 });
}
