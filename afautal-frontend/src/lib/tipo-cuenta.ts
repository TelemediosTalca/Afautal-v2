const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

export interface TipoCuenta {
  id: number;
  nombre: string;
  documentId?: string;
}

export async function fetchTiposCuenta(token: string): Promise<TipoCuenta[]> {
  const response = await fetch(`${STRAPI_URL}/api/tipos-cuenta?sort=nombre:asc`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("No se pudieron obtener los tipos de cuenta.");
    return [];
  }

  const body = await response.json();
  return body.data;
}