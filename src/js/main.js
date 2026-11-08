import { MealAPI } from "./api/mealdb.js";
import { NutritionAPI } from "./api/nutrition.js";
import { ProductAPI } from "./api/products.js";
import { FoodLog } from "./state/appState.js";
import { Router } from "./router.js";
import * as ui from "./ui/components.js";

const $ = (id) => document.getElementById(id);

const PAGES = ["meals", "products", "foodlog"];

// Which sections are visible on each screen
const SECTIONS = {
  meals: ["search-filters-section", "meal-categories-section", "all-recipes-section"],
  detail: ["meal-details"],
  products: ["products-section"],
  foodlog: ["foodlog-section"],
};

const HEADERS = {
  meals: ["Meals & Recipes", "Discover delicious and nutritious recipes tailored for you"],
  products: ["Product Scanner", "Search packaged products and check their nutrition grade"],
  foodlog: ["Food Log", "Track and monitor your daily nutrition intake"],
};

class App {
  constructor() {
    this.mealApi = new MealAPI();
    this.nutritionApi = new NutritionAPI();
    this.productApi = new ProductAPI();
    this.foodLog = new FoodLog();

    this.currentMeal = null;
    this.products = [];
    this.searchTimer = null;

    // Each route = one tab. The Router keeps the URL hash in sync.
    this.router = new Router(
      {
        meals: () => this.showPage("meals"),
        products: () => this.showPage("products"),
        foodlog: () => this.showPage("foodlog"),
      },
      "meals"
    );
  }

  async init() {
    $("app-loading-overlay").style.display = "flex";
    this.setupEvents();
    ui.showMessage($("products-grid"), "Search for products to see results", "fa-barcode");
    this.router.handle();

    await Promise.all([this.loadCategories(), this.loadCuisines(), this.loadRecipes("")]);
    $("app-loading-overlay").style.display = "none";
  }

  /* ---------------- Navigation ---------------- */

  showSection(key) {
    Object.values(SECTIONS)
      .flat()
      .forEach((id) => ($(id).style.display = "none"));
    SECTIONS[key].forEach((id) => ($(id).style.display = ""));
  }

  showPage(page) {
    this.showSection(page);

    document.querySelector("#header h1").textContent = HEADERS[page][0];
    document.querySelector("#header p").textContent = HEADERS[page][1];

    document.querySelectorAll(".nav-link").forEach((link, i) => {
      const active = PAGES[i] === page;
      link.classList.toggle("bg-emerald-50", active);
      link.classList.toggle("text-emerald-700", active);
      link.classList.toggle("text-gray-600", !active);
    });

    if (page === "foodlog") this.renderFoodLog();
    this.closeSidebar();
    window.scrollTo(0, 0);
  }

  closeSidebar() {
    $("sidebar").classList.remove("open");
    $("sidebar-overlay").classList.remove("active");
  }

  /* ---------------- Meals ---------------- */

  async loadCategories() {
    try {
      ui.renderCategories(await this.mealApi.getCategories(), $("categories-grid"));
    } catch (err) {
      ui.showMessage($("categories-grid"), err.message);
    }
  }

  async loadCuisines() {
    try {
      ui.renderCuisinePills(await this.mealApi.getAreas(), $("cuisine-pills-row"));
    } catch (err) {
      ui.renderCuisinePills([], $("cuisine-pills-row"));
    }
    // Show only the first 2 rows of pills until "See more" is clicked
    $("cuisine-pills-row").style.maxHeight = "84px";
    $("cuisine-see-more-btn").style.display = "inline-flex";
  }

  toggleCuisines() {
    const row = $("cuisine-pills-row");
    const btn = $("cuisine-see-more-btn");
    const expanded = btn.classList.toggle("expanded");
    row.style.maxHeight = expanded ? row.scrollHeight + "px" : "84px";
    btn.querySelector("span").textContent = expanded ? "See less" : "See more";
  }

  // Fetches meals with the given function and shows them in the grid
  async showMeals(fetchMeals) {
    ui.showLoading($("recipes-grid"));
    try {
      const meals = await fetchMeals();
      if (meals.length === 0) {
        ui.showMessage($("recipes-grid"), "No recipes found");
        $("recipes-count").textContent = "No recipes found";
        return;
      }
      ui.renderRecipeCards(meals, $("recipes-grid"));
      $("recipes-count").textContent = `Showing ${meals.length} recipes`;
    } catch (err) {
      ui.showMessage($("recipes-grid"), err.message, "fa-triangle-exclamation");
    }
  }

  loadRecipes(term) {
    return this.showMeals(() => this.mealApi.search(term));
  }

  filterByCategory(category) {
    $("search-input").value = "";
    ui.setActivePill($("cuisine-pills-row"), null);
    this.showMeals(() => this.mealApi.filterByCategory(category));
  }

  filterByArea(area) {
    $("search-input").value = "";
    ui.setActivePill($("cuisine-pills-row"), area);
    if (area) this.showMeals(() => this.mealApi.filterByArea(area));
    else this.loadRecipes("");
  }

  /* ---------------- Meal details ---------------- */

  async openMeal(id) {
    this.showSection("detail");
    window.scrollTo(0, 0);
    document.querySelector("#meal-details h1").textContent = "Loading...";

    try {
      const meal = await this.mealApi.lookup(id);
      if (!meal) {
        document.querySelector("#meal-details h1").textContent = "Recipe not found";
        return;
      }
      this.currentMeal = meal;
      ui.renderMealDetail(meal);
      this.loadNutrition(meal);
    } catch (err) {
      document.querySelector("#meal-details h1").textContent = "Couldn't load this recipe";
    }
  }

  async loadNutrition(meal) {
    const box = $("nutrition-facts-container");
    ui.showLoading(box);
    try {
      const n = await this.nutritionApi.analyze(meal);
      if (this.currentMeal !== meal) return; // user opened another meal meanwhile
      ui.renderNutritionFacts(box, n);
      $("hero-calories").textContent = Math.round(n.calories) + " cal";
      $("hero-servings").textContent = (n.servings || "-") + " servings";
    } catch (err) {
      ui.showMessage(box, err.message, "fa-triangle-exclamation");
      $("hero-calories").textContent = "N/A";
      $("hero-servings").textContent = "N/A";
    }
  }

  // "Log This Meal" button: adds one serving to the food log
  async logMeal() {
    const meal = this.currentMeal;
    if (!meal) return;

    try {
      const n = await this.nutritionApi.analyze(meal);
      this.foodLog.add({
        id: meal.idMeal,
        name: meal.strMeal,
        image: meal.strMealThumb,
        type: "meal",
        servings: 1,
        calories: n.calories,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
      });
      Swal.fire({ icon: "success", title: "Meal logged!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Couldn't log this meal", text: err.message });
    }
  }

  /* ---------------- Products ---------------- */

  // Fetches products with the given function and shows them
  async showProducts(fetchProducts) {
    ui.showLoading($("products-grid"));
    try {
      this.products = await fetchProducts();
      if (this.products.length === 0) {
        ui.showMessage($("products-grid"), "No products found", "fa-barcode");
        $("products-count").textContent = "No products found";
        return;
      }
      ui.renderProductCards(this.products, $("products-grid"));
      $("products-count").textContent = `Showing ${this.products.length} products`;
    } catch (err) {
      ui.showMessage($("products-grid"), err.message, "fa-triangle-exclamation");
      $("products-count").textContent = "";
    }
  }

  addProductToLog(barcode) {
    const p = this.products.find((item) => item.barcode === barcode);
    if (!p) return;
    const n = p.nutrients || {};

    // Product nutrients are per 100g
    this.foodLog.add({
      id: p.barcode,
      name: p.name || "Unnamed product",
      image: p.image || "",
      type: "product",
      servings: 1,
      calories: n.calories || 0,
      protein: n.protein || 0,
      carbs: n.carbs || 0,
      fat: n.fat || 0,
    });
    Swal.fire({ icon: "success", title: "Added to Food Log!", timer: 1500, showConfirmButton: false });
  }

  /* ---------------- Food log ---------------- */

  renderFoodLog() {
    $("foodlog-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

    const items = this.foodLog.getToday();
    ui.renderFoodLog(items, $("logged-items-list"));
    document.querySelector("#foodlog-today-section h4").textContent = `Logged Items (${items.length})`;
    ui.updateProgress(this.foodLog.getTotals());
  }

  /* ---------------- Events ---------------- */

  setupEvents() {
    // Sidebar
    $("header-menu-btn").addEventListener("click", () => {
      $("sidebar").classList.add("open");
      $("sidebar-overlay").classList.add("active");
    });
    $("sidebar-close-btn").addEventListener("click", () => this.closeSidebar());
    $("sidebar-overlay").addEventListener("click", () => this.closeSidebar());

    // Tabs: each link goes to #meals / #products / #foodlog
    document.querySelectorAll(".nav-link").forEach((link, i) => {
      link.href = "#" + PAGES[i];
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.router.go(PAGES[i]);
      });
    });

    // Meals: search (waits 400ms after typing stops)
    $("search-input").addEventListener("input", (e) => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        ui.setActivePill($("cuisine-pills-row"), null);
        this.loadRecipes(e.target.value.trim());
      }, 400);
    });
    $("cuisine-pills-row").addEventListener("click", (e) => {
      const pill = e.target.closest(".cuisine-pill");
      if (pill) this.filterByArea(pill.dataset.area);
    });
    $("cuisine-see-more-btn").addEventListener("click", () => this.toggleCuisines());
    $("categories-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".category-card");
      if (card) this.filterByCategory(card.dataset.category);
    });
    $("recipes-grid").addEventListener("click", (e) => {
      const card = e.target.closest(".recipe-card");
      if (card) this.openMeal(card.dataset.mealId);
    });

    // Meal details
    $("back-to-meals-btn").addEventListener("click", () => this.showSection("meals"));
    $("log-meal-btn").addEventListener("click", () => this.logMeal());

    // Products
    const searchProducts = () => {
      const term = $("product-search-input").value.trim();
      if (term) this.showProducts(() => this.productApi.search(term));
    };
    $("search-product-btn").addEventListener("click", searchProducts);
    $("product-search-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") searchProducts();
    });

    const lookupBarcode = () => {
      const barcode = $("barcode-input").value.trim();
      if (!barcode) return;
      this.showProducts(async () => {
        const product = await this.productApi.getByBarcode(barcode);
        return product ? [product] : [];
      });
    };
    $("lookup-barcode-btn").addEventListener("click", lookupBarcode);
    $("barcode-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") lookupBarcode();
    });

    $("products-grid").addEventListener("click", (e) => {
      const btn = e.target.closest(".add-product-btn");
      if (btn) this.addProductToLog(btn.closest("[data-barcode]").dataset.barcode);
    });

    // Food log: remove one item
    $("logged-items-list").addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-log-btn");
      if (!btn) return;
      this.foodLog.remove(btn.dataset.loggedAt);
      this.renderFoodLog();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => new App().init());
