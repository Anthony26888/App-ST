// Composables
import { createRouter, createWebHistory } from "vue-router";
import App from "@/layouts/default.vue"
import PageCheck from "@/pages/Page-Check.vue"
import PageWareHouse from "@/pages/Page-WareHouse.vue";
import PageOrders from "@/pages/Page-Orders.vue";
import PageSetting from "@/pages/Page-Setting.vue";
import PageLogin from "@/pages/Page-Login.vue";
import PageUsers from "@/pages/Page-Users.vue"
import PageReg from "@/pages/Page-Reg.vue";
const routes = [
  {
    path: "/",
    component: App,
    children: [
      {
        path: "/Kiem-tra-so-lieu",
        name: "Check",
        meta: { requiresAuth: true },
        component: PageCheck,
      },
      {
        path: "/Ton-kho",
        name: "WareHouse",
        meta: { requiresAuth: true },
        component: PageWareHouse,
      },
      {
        path: "/Don-hang",
        name: "Orders",
        meta: { requiresAuth: true },
        component: PageOrders,
      },
      {
        path: "/Cai-dat/",
        name: "Setting",
        meta: { requiresAuth: true },
        component: PageSetting,
      },
      {
        path: "/Cai-dat/Danh-sach-thanh-vien",
        name: "Users",
        meta: { requiresAuth: true },
        component: PageUsers,
      },
      {
        path: "/Cai-dat/Dang-ky-thanh-vien",
        name: "Register",
        meta: { requiresAuth: true },
        component: PageReg,
      },
      {
        path: "/Home/:PO",
        name: "Pages",
        meta: { requiresAuth: true },
        component: () =>
          import(/* webpackChunkName: "home" */ "@/pages/Page-Check.vue"),
      },
    ],
  },
  {
    path: "/Dang-nhap",
    name: "Login",
    meta: { requiresAuth: true },
    component: PageLogin,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return { top: 0 };
  },
});
// Route Guard kiểm tra token
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;