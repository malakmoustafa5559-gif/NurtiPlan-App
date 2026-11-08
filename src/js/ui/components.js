// Rendering helpers: take data + a container and write HTML into it.

export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const round = (n) => Math.round((Number(n) || 0) * 10) / 10;

/* ---------- Loading / message ---------- */

export function showLoading(container) {
  container.innerHTML = `
    <div class="flex items-center justify-center py-10 text-gray-500" style="grid-column: 1 / -1">
      <i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading...
    </div>`;
}

export function showMessage(container, text, icon = "fa-search") {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center py-10" style="grid-column: 1 / -1">
      <i class="fa-solid ${icon} text-gray-300 text-4xl mb-3"></i>
      <p class="text-gray-500">${escapeHtml(text)}</p>
    </div>`;
}

/* ---------- Meals page ---------- */

export function renderCategories(categories, container) {
  container.innerHTML = categories
    .map(
      (cat) => `
      <div class="category-card rounded-xl p-3 border hover:shadow-md cursor-pointer transition-all"
           data-category="${escapeHtml(cat.strCategory)}">
        <div class="flex items-center gap-2.5">
          <div class="category-icon text-white w-9 h-9 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-utensils"></i>
          </div>
          <h3 class="text-sm font-bold text-gray-900">${escapeHtml(cat.strCategory)}</h3>
        </div>
      </div>`
    )
    .join("");
}

export function renderCuisinePills(areas, container) {
  const all = `<button type="button" class="cuisine-pill active" data-area="">All Cuisines</button>`;
  const pills = areas
    .map((a) => `<button type="button" class="cuisine-pill" data-area="${escapeHtml(a)}">${escapeHtml(a)}</button>`)
    .join("");
  container.innerHTML = all + pills;
}

export function setActivePill(container, area) {
  container.querySelectorAll(".cuisine-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.area === (area || ""));
  });
}

export function renderRecipeCards(meals, container) {
  container.innerHTML = meals
    .map(
      (meal) => `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
           data-meal-id="${escapeHtml(meal.idMeal)}">
        <div class="h-48 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
        </div>
        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-2 line-clamp-1">${escapeHtml(meal.strMeal)}</h3>
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-gray-900">
              <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(meal.strCategory || "-")}
            </span>
            <span class="font-semibold text-gray-500">
              <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(meal.strArea || "-")}
            </span>
          </div>
        </div>
      </div>`
    )
    .join("");
}

/* ---------- Meal details ---------- */

function youtubeEmbedUrl(url) {
  const match = (url || "").match(/[?&]v=([^&]+)/);
  return match ? "https://www.youtube.com/embed/" + match[1] : null;
}

export function renderMealDetail(meal) {
  const $ = (sel) => document.querySelector(sel);

  const img = $("#meal-details .relative.h-80 img");
  img.src = meal.strMealThumb;
  img.alt = meal.strMeal;
  $("#meal-details h1").textContent = meal.strMeal;

  $("#meal-details .absolute.bottom-0 .flex.items-center.gap-3").innerHTML = [meal.strCategory, meal.strArea]
    .filter(Boolean)
    .map((b, i) => `<span class="px-3 py-1 ${i === 0 ? "bg-emerald-500" : "bg-blue-500"} text-white text-sm font-semibold rounded-full">${escapeHtml(b)}</span>`)
    .join("");

  // Ingredients
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal["strIngredient" + i];
    if (name && name.trim()) ingredients.push({ name, measure: meal["strMeasure" + i] || "" });
  }
  $("#meal-details h2 .ml-auto").textContent = ingredients.length + " items";
  $("#meal-details .grid.grid-cols-1.md\\:grid-cols-2.gap-3").innerHTML = ingredients
    .map(
      (item) => `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <input type="checkbox" class="w-5 h-5 rounded border-gray-300" />
        <span class="text-gray-700"><b>${escapeHtml(item.measure)}</b> ${escapeHtml(item.name)}</span>
      </div>`
    )
    .join("");

  // Instructions: one step per line
  const steps = (meal.strInstructions || "").split(/\r?\n/).filter((s) => s.trim());
  $("#meal-details .space-y-4").innerHTML = steps
    .map(
      (step, i) => `
      <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50">
        <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${i + 1}</div>
        <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
      </div>`
    )
    .join("");

  // Video
  const embed = youtubeEmbedUrl(meal.strYoutube);
  $("#meal-details .aspect-video").innerHTML = embed
    ? `<iframe src="${embed}" class="absolute inset-0 w-full h-full" frameborder="0" allowfullscreen></iframe>`
    : `<div class="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No video available</div>`;

  $("#hero-servings").innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  $("#hero-calories").innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
}

const MACROS = [
  { key: "protein", label: "Protein", color: "bg-emerald-500", daily: 50 },
  { key: "carbs", label: "Carbs", color: "bg-blue-500", daily: 275 },
  { key: "fat", label: "Fat", color: "bg-purple-500", daily: 78 },
  { key: "fiber", label: "Fiber", color: "bg-orange-500", daily: 28 },
  { key: "sugar", label: "Sugar", color: "bg-pink-500", daily: 50 },
  { key: "saturatedFat", label: "Saturated Fat", color: "bg-red-500", daily: 20 },
];

export function renderNutritionFacts(container, n) {
  const rows = MACROS.map((m) => {
    const percent = Math.min(100, Math.round(((n[m.key] || 0) / m.daily) * 100));
    return `
      <div class="flex items-center justify-between">
        <span class="text-gray-700">${m.label}</span>
        <span class="font-bold text-gray-900">${Math.round(n[m.key] || 0)}g</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-2">
        <div class="${m.color} h-2 rounded-full" style="width: ${percent}%"></div>
      </div>`;
  }).join("");

  container.innerHTML = `
    <p class="text-sm text-gray-500 mb-4">Per serving</p>
    <div class="text-center py-4 mb-4 bg-emerald-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${Math.round(n.calories || 0)}</p>
      <p class="text-xs text-gray-500 mt-1">Total: ${Math.round(n.totalCalories || 0)} cal</p>
    </div>
    <div class="space-y-4">${rows}</div>
    <div class="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
      <div class="flex justify-between"><span class="text-gray-600">Cholesterol</span><span class="font-medium">${Math.round(n.cholesterol || 0)}mg</span></div>
      <div class="flex justify-between"><span class="text-gray-600">Sodium</span><span class="font-medium">${Math.round(n.sodium || 0)}mg</span></div>
    </div>`;
}

/* ---------- Products page ---------- */

const GRADE_COLORS = { a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-500", d: "bg-orange-500", e: "bg-red-500" };

export function renderProductCards(products, container) {
  container.innerHTML = products
    .map((p) => {
      const grade = (p.nutritionGrade || "").toLowerCase();
      const n = p.nutrients || {};
      return `
      <div class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all" data-barcode="${escapeHtml(p.barcode)}">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          ${p.image
            ? `<img class="w-full h-full object-contain" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" />`
            : `<i class="fa-solid fa-box-open text-gray-300 text-3xl"></i>`}
          <div class="absolute top-2 left-2 ${GRADE_COLORS[grade] || "bg-gray-400"} text-white text-xs font-bold px-2 py-1 rounded uppercase">
            ${GRADE_COLORS[grade] ? "Nutri-Score " + grade : "Not rated"}
          </div>
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(p.brand || "Unknown brand")}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${escapeHtml(p.name || "Unnamed product")}</h3>
          <p class="text-xs text-gray-500 mb-3"><i class="fa-solid fa-fire mr-1"></i>${Math.round(n.calories || 0)} kcal/100g</p>
          <div class="grid grid-cols-4 gap-1 text-center">
            <div class="bg-emerald-50 rounded p-1.5"><p class="text-xs font-bold text-emerald-700">${round(n.protein)}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
            <div class="bg-blue-50 rounded p-1.5"><p class="text-xs font-bold text-blue-700">${round(n.carbs)}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
            <div class="bg-purple-50 rounded p-1.5"><p class="text-xs font-bold text-purple-700">${round(n.fat)}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
            <div class="bg-orange-50 rounded p-1.5"><p class="text-xs font-bold text-orange-700">${round(n.sugar)}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
          </div>
          <button type="button" class="add-product-btn mt-3 w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all">
            <i class="fa-solid fa-plus mr-1"></i>Add to Food Log
          </button>
        </div>
      </div>`;
    })
    .join("");
}

/* ---------- Food log page ---------- */

export function renderFoodLog(entries, container) {
  if (entries.length === 0) {
    showMessage(container, "No meals logged today", "fa-utensils");
    return;
  }

  container.innerHTML = entries
    .map(
      (e) => `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        ${e.image
          ? `<img src="${escapeHtml(e.image)}" alt="${escapeHtml(e.name)}" class="w-12 h-12 rounded-lg object-cover" />`
          : `<div class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-box-open text-gray-400"></i></div>`}
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">${escapeHtml(e.name)}</p>
          <p class="text-xs text-gray-500">${e.servings} serving${e.servings === 1 ? "" : "s"} &bull; ${e.type === "product" ? "Product" : "Recipe"}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="font-bold text-gray-900">${Math.round(e.calories)}<span class="text-xs font-normal text-gray-500"> kcal</span></p>
          <p class="text-[10px] text-gray-500">${Math.round(e.protein)}g P &bull; ${Math.round(e.carbs)}g C &bull; ${Math.round(e.fat)}g F</p>
        </div>
        <button class="remove-log-btn text-gray-400 hover:text-red-500 shrink-0" data-logged-at="${escapeHtml(e.loggedAt)}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`
    )
    .join("");
}

// Daily targets
const TARGETS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

export function updateProgress(totals) {
  Object.keys(TARGETS).forEach((key) => {
    const value = Math.round(totals[key]);
    const unit = key === "calories" ? "kcal" : "g";
    document.getElementById(`foodlog-${key}-value`).textContent = `${value} / ${TARGETS[key]} ${unit}`;
    document.getElementById(`foodlog-${key}-bar`).style.width = Math.min(100, (value / TARGETS[key]) * 100) + "%";
  });
}
