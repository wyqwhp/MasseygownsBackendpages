import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import process from "process";

export async function convertToHtml() {
    console.error("Converting...");

    const inputPath = process.argv[2];

    if (!inputPath) {
        console.error("❌ Please provide a DOCX file path");
        process.exit(1);
    }

    // extract file name without extension
    const baseName = path.parse(inputPath).name;

    // create output file name with .html
    const outputPath = path.join(
        path.dirname(inputPath),
        `${baseName}.html`
    );

    console.error("Converting...");

    const result = await mammoth.convertToHtml({ path: inputPath });

    fs.writeFileSync(outputPath, result.value, "utf8");

    return outputPath;
}

convertToHtml();

