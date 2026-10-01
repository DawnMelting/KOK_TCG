import catalogo from "../../../../catalogo_crudo.json";

export const dynamic = "force-static";

export async function GET() {
  const productos = catalogo.filter((registro) => registro.stockTotal > 0).map((registro) => ({
    id: registro.id,
    nombre: registro.carta.nombre,
    codigo: registro.codigo,
    imagen: registro.imagen,
    stock: registro.stockTotal,
    precio: registro.precioPromedio,
    edicion: registro.carta.edicion.nombre,
    tipo: registro.carta.tipo.nombre,
    raza: registro.carta.cartas_razas[0]?.raza.nombre ?? "",
    coste: registro.carta.coste,
    fuerza: registro.carta.fuerza,
    rareza: registro.versiones_rarezas[0]?.rareza.nombre ?? "",
  }));

  return Response.json(productos);
}