const BASE_URL = "https://nutriplan-api.vercel.app/api/products";

export class ProductAPI {
  async get(path) {
    const res = await fetch(BASE_URL + path);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  }

  async search(query) {
    const data = await this.get(`/search?q=${query}&page=1&limit=24`);
    return data.results || [];
  }

  async getByBarcode(barcode) {
    const data = await this.get("/barcode/" + barcode);
    return data.result || null;
  }
}
