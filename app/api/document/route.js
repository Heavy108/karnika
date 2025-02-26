// ... Other imports remain the same
import { NextResponse } from "next/server";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    console.log("Processing file upload...");

    const formData = await req.formData();
    const files = formData.getAll("file");
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const name = `projects/434747187345/locations/us/processors/211dd67813f388aa/processorVersions/8de12be087a69a96`;
    if (!name) {
      throw new Error("Missing DOCUMENT_API environment variable");
    }

    const client = new DocumentProcessorServiceClient();

    const uploadsDir = path.join(process.cwd(), "uploads");
    const csvName = formData.get("csvName") || "document_data.csv";
    const csvFile = path.join(uploadsDir, csvName);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (!fs.existsSync(csvFile)) {
      const header = "Timestamp,Enrollment Number,Total\n";
      fs.writeFileSync(csvFile, header, "utf8");
    }

    for (const file of files) {
      console.log("Processing file:", file.name);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const encodedContent = buffer.toString("base64");

      console.log("Making request to Document AI...");

      const requestPayload = {
        name,
        rawDocument: {
          content: encodedContent,
          mimeType: file.type || "application/pdf",
        },
      };

      const [result] = await client.processDocument(requestPayload);
      const { document } = result;
      console.log("Extracted Entities:", document.entities);

      const enrollmentEntity = document.entities.find((entity) =>
        entity.type.toLowerCase().includes("enrollment")
      );

    
      const totalEntities = document.entities.filter(
        (entity) => entity.type.toLowerCase() === "total"
      );
      const totalEntity =
        totalEntities.length > 0
          ? totalEntities[totalEntities.length - 1]
          : null;

      console.log("Extraction Successful for file:", file.name);

      const timestamp = new Date().toISOString();
      const enrollment = enrollmentEntity ? enrollmentEntity.mentionText : "";
      const total = totalEntity ? totalEntity.mentionText : "";

      const csvRow = `"${timestamp}","${enrollment}","${total}"\n`;

      fs.appendFileSync(csvFile, csvRow, "utf8");
    }

    console.log("Data appended to CSV file successfully");
    return NextResponse.json({
      message: "Files processed and data appended to CSV file",
      processedFiles: files.length,
    });
  } catch (error) {
    console.error("Document AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
