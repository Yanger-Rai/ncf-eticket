import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticket, sellerName } = body;

  if (!ticket || !sellerName) {
    return NextResponse.json({ error: "Missing ticket data" }, { status: 400 });
  }

  // Construct the URL for our ticket template page
  const url = new URL("/ticket-template", req.url);
  url.searchParams.set("ticket", JSON.stringify(ticket));
  url.searchParams.set("sellerName", sellerName);

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
    await page.goto(url.toString(), { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      // We can set margins to 0 if the template handles its own padding
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    await browser.close();

    const buffer = Buffer.from(pdfBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NCF_Ticket_${ticket.id}.pdf"`,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}
