'use client';

import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  nombre: string;
  codigo: string;
  imagen: string;
  stock: number;
  precio: number;
  edicion: string;
  tipo: string;
  raza: string;
  coste: number | null;
  fuerza: number | null;
  rareza: string;
};

type CartItem = Product & { quantity: number };

const PAGE_SIZE = 12;

const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState('TODAS');
  const [type, setType] = useState('TODOS');
  const [sort, setSort] = useState<'precio' | 'stock' | 'nombre'>('precio');
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('myl-cart');
    let restoredCart: CartItem[] = [];

    if (savedCart) {
      try {
        const parsedCart: unknown = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) restoredCart = parsedCart as CartItem[];
      } catch {
        restoredCart = [];
      }
    }

    fetch('/api/catalogo')
      .then((response) => response.json())
      .then((data: Product[]) => {
        const availableProducts = data.filter((product) => product.stock > 0);
        const productsById = new Map(availableProducts.map((product) => [product.id, product]));
        setProducts(availableProducts);
        setCart(
          restoredCart.flatMap((item) => {
            const product = productsById.get(item.id);
            if (!product) return [];

            const quantity = Math.min(Number(item.quantity) || 0, product.stock);
            return quantity > 0 ? [{ ...product, quantity }] : [];
          }),
        );
      })
      .catch(() => {
        setProducts([]);
        setCart([]);
      })
      .finally(() => setCatalogLoaded(true));

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !catalogLoaded) return;
    localStorage.setItem('myl-cart', JSON.stringify(cart));
  }, [cart, catalogLoaded, mounted]);

  useEffect(() => {
    if (!cartOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [cartOpen]);

  const editions = useMemo(
    () => ['TODAS', ...new Set(products.map((p) => p.edicion))].filter(Boolean),
    [products],
  );

  const types = useMemo(
    () => ['TODOS', ...new Set(products.map((p) => p.tipo))].filter(Boolean),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...products]
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.nombre.toLowerCase().includes(query) ||
          product.codigo.toLowerCase().includes(query) ||
          product.edicion.toLowerCase().includes(query) ||
          product.raza.toLowerCase().includes(query);

        const matchesEdition = edition === 'TODAS' || product.edicion === edition;
        const matchesType = type === 'TODOS' || product.tipo === type;

        return matchesSearch && matchesEdition && matchesType;
      })
      .sort((a, b) => {
        if (sort === 'nombre') return a.nombre.localeCompare(b.nombre);
        if (sort === 'stock') return b.stock - a.stock;
        return b.precio - a.precio;
      });
  }, [edition, products, search, sort, type]);

  const pages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, edition, type, sort]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const orderSummary = cart
    .map((item) => `${item.nombre} x${item.quantity} (${formatPrice(item.precio)})`)
    .join(' | ');

  const shareText = `Hola, quiero estos productos de MYL:\n${orderSummary || 'Sin productos aún'}\nTotal estimado: ${formatPrice(subtotal)}`;

  const handleShare = async () => {
    const message = encodeURIComponent(shareText);
    const url = `https://wa.me/?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setCartOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
        <header className="mb-8 rounded-3xl bg-[#201814] p-6 text-white shadow-lg shadow-zinc-900/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">MYL</p>
              <h1 className="mt-2 text-3xl font-black sm:text-5xl">Tienda de cartas</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-zinc-200">
                {products.length} cartas cargadas
              </div>
              <div className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-[#201814]">
                {totalItems} en carrito
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
              <div className="grid gap-3 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))_auto]">
                <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <span aria-hidden="true">🔎</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar nombre, código, edición o raza"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
                  />
                </label>

                <select
                  value={edition}
                  onChange={(event) => setEdition(event.target.value)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none"
                >
                  {editions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none"
                >
                  {types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as 'precio' | 'stock' | 'nombre')}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none"
                >
                  <option value="precio">Precio</option>
                  <option value="stock">Stock</option>
                  <option value="nombre">Nombre</option>
                </select>
              </div>
            </div>

            {!catalogLoaded ? (
              <div className="rounded-3xl bg-white p-8 text-center text-zinc-600 shadow-sm ring-1 ring-zinc-200">
                Cargando catálogo…
              </div>
            ) : !filteredProducts.length ? (
              <div className="rounded-3xl bg-white p-8 text-center text-zinc-600 shadow-sm ring-1 ring-zinc-200">
                No hay cartas disponibles con estos filtros.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-zinc-600">
                  <span>
                    {filteredProducts.length} resultados • página {page}/{pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="font-medium text-[#201814] underline-offset-4 hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedProducts.map((product) => {
                    return (
                      <article
                        key={product.id}
                        className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative">
                          <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="h-56 w-full object-contain bg-gradient-to-b from-zinc-100 to-white p-4"
                          />
                        </div>

                        <div className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{product.edicion}</p>
                              <h2 className="mt-1 text-lg font-bold leading-tight">{product.nombre}</h2>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                              {product.rareza}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                            <span className="rounded-full bg-zinc-100 px-2 py-1">{product.tipo}</span>
                            {product.raza ? <span className="rounded-full bg-zinc-100 px-2 py-1">{product.raza}</span> : null}
                            {product.coste !== null ? <span className="rounded-full bg-zinc-100 px-2 py-1">Costo {product.coste}</span> : null}
                            {product.fuerza !== null ? <span className="rounded-full bg-zinc-100 px-2 py-1">Fuerza {product.fuerza}</span> : null}
                          </div>

                          <div className="flex items-center justify-between text-sm text-zinc-600">
                            <span>Stock: {product.stock}</span>
                          </div>

                          <div className="flex items-end justify-between gap-3 pt-2">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Precio</p>
                              <p className="text-2xl font-black text-[#201814]">{formatPrice(product.precio)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              className="rounded-full bg-[#201814] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3b2d27]"
                            >
                              + Agregar
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-zinc-600">
                    Página {page} de {pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pages}
                    onClick={() => setPage((value) => Math.min(pages, value + 1))}
                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>

          <aside
            id="cart-panel"
            aria-label="Carrito"
            className={`${cartOpen ? 'block' : 'hidden'} fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-[#201814] p-5 text-white shadow-2xl lg:sticky lg:top-6 lg:z-auto lg:block lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:rounded-3xl lg:shadow-lg lg:shadow-zinc-900/10`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Carrito</h2>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-200">
                  {totalItems} ítems
                </span>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl lg:hidden"
                  aria-label="Cerrar carrito"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-zinc-300">
                  Aún no agregas cartas.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.nombre}</p>
                        <p className="text-xs text-zinc-300">{item.edicion}</p>
                      </div>
                      <p className="font-bold">{formatPrice(item.precio * item.quantity)}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-xs text-zinc-300">{formatPrice(item.precio)} c/u</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm text-zinc-300">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-lg font-black">
                <span>Total estimado</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleShare}
                className="w-full rounded-full bg-amber-400 px-4 py-3 font-bold text-[#201814] transition hover:bg-amber-300"
              >
                Pedir por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(shareText);
                  setCartOpen(false);
                }}
                className="w-full rounded-full border border-white/20 px-4 py-3 font-semibold text-white transition hover:bg-white/5"
              >
                Copiar pedido
              </button>
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-300">
              Este sitio es una vitrina de compra sin pasarela. El pedido se prepara para compartir por WhatsApp o copiarlo y enviarlo por tu canal preferido.
            </p>
          </aside>
        </section>

        {cartOpen ? (
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
            aria-label="Cerrar carrito"
          />
        ) : null}

        <div
          className={`${cartOpen ? 'hidden' : 'block'} fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden`}
        >
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-controls="cart-panel"
            aria-expanded={cartOpen}
            className="flex w-full items-center justify-between rounded-xl bg-[#201814] px-4 py-3 text-left text-white"
          >
            <span>
              <span className="block text-sm font-bold">Ver carrito · {totalItems} ítems</span>
              <span className="text-xs text-zinc-300">Toca para revisar tu pedido</span>
            </span>
            <span className="text-base font-black">{formatPrice(subtotal)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
