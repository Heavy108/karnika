// Server-side code to handle CSV download
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const csvName = url.searchParams.get("csvName") || "document_data.csv";
    const uploadsDir = path.join(process.cwd(), "uploads");
    const csvFile = path.join(uploadsDir, csvName);

    if (!fs.existsSync(csvFile)) {
      return NextResponse.json(
        { error: "CSV file not found" },
        { status: 404 }
      );
    }

    const fileStream = fs.createReadStream(csvFile);
    return new NextResponse(fileStream, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${csvName}"`,
      },
    });
  } catch (error) {
    console.error("Error serving CSV file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
