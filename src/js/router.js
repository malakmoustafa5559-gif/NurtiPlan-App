// Changes the URL hash (#meals / #products / #foodlog) with every tab
export class Router {
  constructor(routes, defaultRoute) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    window.addEventListener("hashchange", () => this.handle());
  }

  go(page) {
    if (location.hash === "#" + page) this.handle();
    else location.hash = page;
  }

  handle() {
    const page = location.hash.slice(1);
    const route = this.routes[page] ? page : this.defaultRoute;
    this.routes[route]();
  }
}
