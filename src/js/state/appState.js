const STORAGE_KEY = "nutriplan:foodlog";

export class FoodLog {
  constructor() {
    this.items = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  add(entry) {
    this.items.push({ ...entry, loggedAt: new Date().toISOString() });
    this.save();
  }

  remove(loggedAt) {
    this.items = this.items.filter((item) => item.loggedAt !== loggedAt);
    this.save();
  }

  getToday() {
    const today = new Date().toDateString();
    return this.items.filter((item) => new Date(item.loggedAt).toDateString() === today);
  }

  getTotals() {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    this.getToday().forEach((item) => {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
    });
    return totals;
  }
}
