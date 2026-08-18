import type { Client, Payment, Product, Purchase, Sale } from "./types";

function daysAgo(days: number, hour = 11): number {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d.getTime();
}

export interface ExampleData {
  products: Product[];
  clients: Client[];
  sales: Sale[];
  payments: Payment[];
  purchases: Purchase[];
}

export function exampleData(): ExampleData {
  const now = Date.now();

  const products: Product[] = [
    { id: "p1", name: "Jean Clásico Azul", category: "Pantalones", size: "32", color: "Azul", sku: "JN-001", cost: 800, price: 1400, stock: 12, minStock: 3, createdAt: now },
    { id: "p2", name: "Camisa Blanca Formal", category: "Camisas", size: "M", color: "Blanco", sku: "CM-002", cost: 450, price: 900, stock: 8, minStock: 3, createdAt: now },
    { id: "p3", name: "Vestido Floral", category: "Vestidos", size: "M", color: "Multicolor", sku: "VS-003", cost: 700, price: 1500, stock: 5, minStock: 2, createdAt: now },
    { id: "p4", name: "Chaqueta Denim", category: "Chaquetas", size: "L", color: "Azul", sku: "CH-004", cost: 950, price: 1800, stock: 4, minStock: 2, createdAt: now },
    { id: "p5", name: "Falda Midi Negra", category: "Faldas", size: "S", color: "Negro", sku: "FL-005", cost: 400, price: 850, stock: 3, minStock: 3, createdAt: now },
    { id: "p6", name: "Blusa de Seda", category: "Blusas", size: "M", color: "Rosa", sku: "BL-006", cost: 380, price: 780, stock: 0, minStock: 2, createdAt: now },
    { id: "p7", name: "Short Vaquero", category: "Pantalones", size: "30", color: "Azul", sku: "JN-007", cost: 520, price: 990, stock: 9, minStock: 3, createdAt: now },
    { id: "p8", name: "Camiseta Básica", category: "Camisetas", size: "L", color: "Blanco", sku: "CT-008", cost: 220, price: 450, stock: 20, minStock: 5, createdAt: now },
  ];

  const clients: Client[] = [
    { id: "c1", name: "María Gómez", phone: "809-555-0101", address: "Calle Duarte #12", createdAt: now },
    { id: "c2", name: "José Martínez", phone: "829-555-0142", address: "Av. 27 de Febrero #45", createdAt: now },
    { id: "c3", name: "Ana Ramírez", phone: "809-555-0199", address: "Calle 16 de Agosto #8", createdAt: now },
  ];

  const sales: Sale[] = [
    {
      id: "s1",
      number: 1,
      date: daysAgo(0, 10),
      items: [
        { productId: "p1", name: "Jean Clásico Azul", qty: 1, price: 1400, cost: 800 },
        { productId: "p2", name: "Camisa Blanca Formal", qty: 1, price: 900, cost: 450 },
      ],
      total: 2300,
      paymentType: "contado",
    },
    {
      id: "s2",
      number: 2,
      date: daysAgo(0, 12),
      clientId: "c1",
      items: [{ productId: "p3", name: "Vestido Floral", qty: 1, price: 1500, cost: 700 }],
      total: 1500,
      paymentType: "credito",
    },
    {
      id: "s3",
      number: 3,
      date: daysAgo(0, 17),
      clientId: "c2",
      items: [{ productId: "p4", name: "Chaqueta Denim", qty: 1, price: 1800, cost: 950 }],
      total: 1800,
      paymentType: "credito",
    },
    {
      id: "s4",
      number: 4,
      date: daysAgo(1, 16),
      items: [
        { productId: "p8", name: "Camiseta Básica", qty: 2, price: 450, cost: 220 },
        { productId: "p7", name: "Short Vaquero", qty: 1, price: 990, cost: 520 },
      ],
      total: 1890,
      paymentType: "contado",
    },
    {
      id: "s5",
      number: 5,
      date: daysAgo(1, 11),
      clientId: "c3",
      items: [{ productId: "p5", name: "Falda Midi Negra", qty: 1, price: 850, cost: 400 }],
      total: 850,
      paymentType: "credito",
    },
    {
      id: "s6",
      number: 6,
      date: daysAgo(2, 15),
      items: [
        { productId: "p2", name: "Camisa Blanca Formal", qty: 1, price: 900, cost: 450 },
        { productId: "p8", name: "Camiseta Básica", qty: 3, price: 450, cost: 220 },
      ],
      total: 2250,
      paymentType: "contado",
    },
    {
      id: "s7",
      number: 7,
      date: daysAgo(3, 14),
      clientId: "c1",
      items: [{ productId: "p7", name: "Short Vaquero", qty: 1, price: 990, cost: 520 }],
      total: 990,
      paymentType: "credito",
    },
    {
      id: "s8",
      number: 8,
      date: daysAgo(4, 16),
      items: [{ productId: "p1", name: "Jean Clásico Azul", qty: 1, price: 1400, cost: 800 }],
      total: 1400,
      paymentType: "contado",
    },
    {
      id: "s9",
      number: 9,
      date: daysAgo(5, 12),
      items: [
        { productId: "p4", name: "Chaqueta Denim", qty: 1, price: 1800, cost: 950 },
        { productId: "p8", name: "Camiseta Básica", qty: 2, price: 450, cost: 220 },
      ],
      total: 2700,
      paymentType: "contado",
    },
    {
      id: "s10",
      number: 10,
      date: daysAgo(6, 13),
      clientId: "c2",
      items: [{ productId: "p3", name: "Vestido Floral", qty: 1, price: 1500, cost: 700 }],
      total: 1500,
      paymentType: "credito",
    },
  ];

  const payments: Payment[] = [
    { id: "pm1", clientId: "c1", amount: 500, date: daysAgo(2, 9), note: "Abono" },
    { id: "pm2", clientId: "c2", amount: 800, date: daysAgo(3, 16), note: "Abono inicial" },
    { id: "pm3", clientId: "c3", amount: 300, date: daysAgo(1, 18), note: "Abono" },
  ];

  const purchases: Purchase[] = [
    {
      id: "pu1",
      date: daysAgo(5, 10),
      supplier: "Distribuidora Moda RD",
      items: [
        { productId: "p1", name: "Jean Clásico Azul", qty: 12, unitCost: 800 },
        { productId: "p8", name: "Camiseta Básica", qty: 20, unitCost: 220 },
      ],
      total: 14000,
    },
  ];

  return { products, clients, sales, payments, purchases };
}
