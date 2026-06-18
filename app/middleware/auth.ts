export default defineNuxtRouteMiddleware((to, from) => {
  const isLoggedIn = useCookie("isLoggedIn");

  if (!isLoggedIn.value && to.path !== "/login") {
    return navigateTo("/login");
  }
});
