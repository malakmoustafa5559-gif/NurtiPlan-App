const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export class MealAPI {
  async get(endpoint) {
    const res = await fetch(BASE_URL + endpoint);
    if (!res.ok) throw new Error("Failed to load meals");
    return res.json();
  }

  async getCategories() {
    const data = await this.get("/categories.php");
    return data.categories || [];
  }

  async getAreas() {
    const data = await this.get("/list.php?a=list");
    return (data.meals || []).map((item) => item.strArea);
  }

  async search(query) {
    const data = await this.get("/search.php?s=" + query);
    return data.meals || [];
  }

  async lookup(id) {
    const data = await this.get("/lookup.php?i=" + id);
    return data.meals ? data.meals[0] : null;
  }

  async filterByCategory(category) {
    const data = await this.get("/filter.php?c=" + category);
    return data.meals || [];
  }

  async filterByArea(area) {
    const data = await this.get("/filter.php?a=" + area);
    return data.meals || [];
  }
}
