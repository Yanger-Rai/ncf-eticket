import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { Ticket, TicketType } from "@/types/types";

// --- TICKET DETAILS MAPPING ---
const TICKET_DETAILS: Record<
  TicketType,
  { price: number; description: string }
> = {
  "Admit One": { price: 350, description: "Admits One Person" },
  "Admit Two": { price: 600, description: "Admits Two People" },
  Family: { price: 1500, description: "Family (Five People)" },
  Donor: { price: 2500, description: "Donor Ticket" },
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ticket = body.ticket as Ticket; // Explicitly cast to the Ticket type
  const { sellerName } = body;

  if (!ticket || !sellerName) {
    return NextResponse.json({ error: "Missing ticket data" }, { status: 400 });
  }

  const ticketDetails =
    TICKET_DETAILS[ticket.ticket_type] || TICKET_DETAILS["Admit One"];
  const purchaseDate = new Date(ticket.purchase_date);
  const formattedDate = purchaseDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // --- HTML Template for the Ticket ---
  const html = `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: transparent; }
          .ticket-render-container { display: inline-block; padding: 1rem; }
          .ticket-container { width: 384px; background: transparent; border-radius: 1rem; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }
          .ticket-top { padding: 1.5rem; flex-grow: 1; background: white; border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; }
          .header-text p { margin: 0; font-size: 0.75rem; color: #6B7280; }
          .header-text h1 { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; color: #1F2937; }
          .logo { width: 3rem; height: 3rem; }
          .info-section { border-top: 1px dashed #D1D5DB; border-bottom: 1px dashed #D1D5DB; margin: 1rem 0; padding: 1rem 0; display: flex; flex-direction: column; gap: 0.75rem; }
          .info-item { display: flex; align-items: flex-start; }
          .info-item svg { width: 1.25rem; height: 1.25rem; color: #6B7280; margin-right: 0.75rem; }
          .info-item-text p { margin: 0; }
          .info-item-text .label { font-weight: 600; color: #1F2937; }
          .info-item-text .value { font-size: 0.875rem; color: #4B5563; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
          .detail p { margin: 0; }
          .detail .label { font-size: 0.75rem; color: #6B7280; text-transform: uppercase; }
          .detail .value { font-weight: 700; font-size: 1rem; color: #111827; word-break: break-word; }
          .ticket-stub { 
            position: relative; 
            background: #991B1B; 
            color: white; 
            padding: 1.25rem; 
            border-bottom-left-radius: 1rem; 
            border-bottom-right-radius: 1rem;
            /* --- THE FIX: Using the exact mask from your CSS file --- */
            mask: radial-gradient(12px at 12px 3px, transparent 98%, #000) -12px 0;
            -webkit-mask: radial-gradient(12px at 12px 3px, transparent 98%, #000) -12px 0;
          }
          .stub-content { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; }
          .thali-img { width: 120px; height: 96px; }
          .stub-text { text-align: right; }
          .stub-text .label { font-size: 0.75rem; opacity: 0.8; }
          .stub-text .value { font-size: 1.5rem; font-family: monospace; font-weight: 700; letter-spacing: 0.05em; }
          .stub-text .desc { font-weight: 700; font-size: 1.25rem; margin-top: 0.5rem; }
          .stub-text .price { font-weight: 700; font-size: 1.125rem; }
        </style>
      </head>
      <body>
        <div class="ticket-render-container">
          <div class="ticket-container">
            <div class="ticket-top">
              <div class="header">
                <div class="header-text">
                  <p>NAGA CHRISTIAN FELLOWSHIP, HYD</p>
                  <h1>NAGA FOOD FEST</h1>
                </div>
                <img src="https://dknmnivlsnzkwhhrrlyz.supabase.co/storage/v1/object/public/ticket-assets/NCF_Logo_BlackTag.png" class="logo" />
              </div>
              <div class="info-section">
                <div class="info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <div class="info-item-text">
                    <p class="label">Saturday, 30 August, 2025</p>
                    <p class="value">07:00pm - 09:00pm</p>
                  </div>
                </div>
                <div class="info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div class="info-item-text">
                    <p class="label">St. Georges Preparatory School</p>
                    <p class="value">Gunfoundry, Abids</p>
                  </div>
                </div>
              </div>
              <div class="details-grid">
                <div class="detail">
                  <p class="label">Purchaser</p>
                  <p class="value">${ticket.purchaser_name}</p>
                </div>
                <div class="detail">
                  <p class="label">Issued By</p>
                  <p class="value">${sellerName}</p>
                </div>
                <div class="detail" style="grid-column: span 2;">
                  <p class="label">Purchase Date</p>
                  <p class="value">${formattedDate}</p>
                </div>
              </div>
            </div>
            <div class="ticket-stub">
              <div class="stub-content">
                <img src="https://dknmnivlsnzkwhhrrlyz.supabase.co/storage/v1/object/public/ticket-assets/thali.png" class="thali-img" />
                <div class="stub-text">
                  <p class="label">Ticket ID</p>
                  <p class="value">${ticket.id}</p>
                  <p class="desc">${ticketDetails.description}</p>
                  <p class="price">₹${ticketDetails.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  let browser;
  try {
    if (process.env.NODE_ENV === "production") {
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 700, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const ticketElement = await page.$(".ticket-render-container");
    if (!ticketElement) {
      throw new Error("Could not find ticket element on the page.");
    }

    const imageBuffer = await ticketElement.screenshot({
      type: "png",
      omitBackground: true,
    });

    await browser.close();

    const buffer = Buffer.from(imageBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="NCF_Ticket_${ticket.id}.png"`,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 }
    );
  }
}
