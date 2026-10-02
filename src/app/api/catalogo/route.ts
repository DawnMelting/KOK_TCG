import { google } from "googleapis";
import catalogo from "../../../../catalogo_crudo.json";

export const dynamic = "force-dynamic";

type InventoryEntry = {
  stock: number;
  precio: number;
};

const cacheDuration = 60_000;
let inventoryCache: Map<string, InventoryEntry> | null = null;
let inventoryCacheTime = 0;

function parseNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getInventory(): Promise<Map<string, InventoryEntry>> {
  if (inventoryCache && Date.now() - inventoryCacheTime < cacheDuration) {
    return inventoryCache;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ?.trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "");

  if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
    throw new Error("Google Sheets credentials are not configured");
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const { data: spreadsheet } = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties(sheetId,title)",
  });
  const inventorySheet = spreadsheet.sheets?.find((sheet) => sheet.properties?.sheetId === 0)
    ?? spreadsheet.sheets?.[0];
  const sheetTitle = inventorySheet?.properties?.title;

  if (!sheetTitle) {
    throw new Error("Google Sheets inventory tab was not found");
  }

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetTitle.replace(/'/g, "''")}'!A:Z`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const [headerRow, ...rows] = data.values ?? [];
  const headers = (headerRow ?? []).map((header) => String(header).trim().toLowerCase());
  const idColumn = headers.indexOf("id");
  const stockColumn = headers.indexOf("stock");
  const priceColumn = headers.indexOf("precio_venta");
  const activeColumn = headers.indexOf("activo");

  if ([idColumn, stockColumn, priceColumn, activeColumn].some((column) => column < 0)) {
    throw new Error("Google Sheets inventory headers are invalid");
  }

  const inventory = new Map<string, InventoryEntry>();

  for (const row of rows) {
    const id = String(row[idColumn] ?? "").trim();
    const stock = parseNumber(row[stockColumn]);
    const price = parseNumber(row[priceColumn]);
    const active = row[activeColumn] === true || String(row[activeColumn]).toLowerCase() === "true";

    if (!id || !active || stock === null || !Number.isInteger(stock) || stock <= 0 || price === null || price < 0) {
      continue;
    }

    inventory.set(id, { stock, precio: price });
  }

  inventoryCache = inventory;
  inventoryCacheTime = Date.now();
  return inventory;
}

export async function GET() {
  try {
    const inventory = await getInventory();
    const productos = catalogo.flatMap((registro) => {
      const existencia = inventory.get(registro.id);
      if (!existencia) return [];

      return [{
        id: registro.id,
        nombre: registro.carta.nombre,
        codigo: registro.codigo,
        imagen: registro.imagen,
        stock: existencia.stock,
        precio: existencia.precio,
        edicion: registro.carta.edicion.nombre,
        tipo: registro.carta.tipo.nombre,
        raza: registro.carta.cartas_razas[0]?.raza.nombre ?? "",
        coste: registro.carta.coste,
        fuerza: registro.carta.fuerza,
        rareza: registro.versiones_rarezas[0]?.rareza.nombre ?? "",
      }];
    });

    return Response.json(productos, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(
      "Catalog inventory request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "No fue posible cargar el inventario." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}