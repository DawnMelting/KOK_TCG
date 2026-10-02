This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Inventario en Google Sheets

La tienda lee la pestaña `inventario` con las columnas `id`, `codigo`, `nombre`, `stock`, `precio_venta` y `activo`. El `id` debe coincidir con el catálogo; `stock` y `precio_venta` deben ser números, y `activo` debe ser una casilla de verificación. Solo los productos activos con stock y precio válidos se muestran. Los cambios se reflejan en aproximadamente un minuto.

En el directorio raíz, crea `.env.local` con:

```dotenv
GOOGLE_SHEETS_ID=1r2A9GRRD_sEfIFpZRePbz5yS_0vFIeP6n-hNIZEjDQ4
GOOGLE_SERVICE_ACCOUNT_EMAIL=tk-ok-tcg-670@gen-lang-client-0697376078.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPEGA_AQUI_LA_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
```

Obtén la clave privada desde el archivo JSON de la cuenta de servicio y reemplaza el texto de ejemplo por su valor `private_key`, conservando los `\n`. No compartas ese archivo ni subas `.env.local` al repositorio. La cuenta de servicio solo necesita permiso de lectura en la hoja.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
