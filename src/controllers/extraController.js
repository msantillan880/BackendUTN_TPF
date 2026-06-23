import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import open from "open";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ExtraController {


    // =========================
    // LEER PDF
    // =========================
    static async leerPdf() {
        return {
            url: "/ExplicacionTPF.pdf"
        };
    }



    // =========================
    // LEER LOG
    // =========================
    static async leerLog() {
        try {
            const filePath = path.join(process.cwd(), "/src/logs/registro_logs.log");

            const content = fs.readFileSync(filePath, "utf-8");

            return {
                ok: true,
                log: content
            };
        } catch (err) {
            throw err;
        }
    }
}