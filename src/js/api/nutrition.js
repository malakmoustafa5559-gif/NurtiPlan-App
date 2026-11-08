const API_URL = "https://nutriplan-api.vercel.app/api/nutrition/analyze";
const API_KEY = "Ahr0UeHTUZDfdky0CemxzfLtX3Y9B1t1Gg4V9IpU";

export class NutritionAPI {
  constructor() {
    this.cache = {}; // so we don't call the API twice for the same meal
  }

  async analyze(meal) {
    if (this.cache[meal.idMeal]) return this.cache[meal.idMeal];

    // TheMealDB stores ingredients as strIngredient1..20 and strMeasure1..20
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal["strIngredient" + i];
      const measure = meal["strMeasure" + i];
      if (name && name.trim()) ingredients.push(`${measure || ""} ${name}`.trim());
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ recipeName: meal.strMeal, ingredients }),
    });
    if (!res.ok) throw new Error("Nutrition analysis failed");

    const json = await res.json();
    const data = json.data;
    const result = {
      ...data.perServing,
      totalCalories: data.totals ? data.totals.calories : 0,
      servings: data.servings,
    };

    this.cache[meal.idMeal] = result;
    return result;
  }
}
