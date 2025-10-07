// Composables
import { createRouter, createWebHistory } from "vue-router";
import App from "@/layouts/default.vue"
import Login from "@/layouts/login.vue"
import PageLogin from "@/pages/Page-Setting/Page-Login.vue";
import PageProject from "@/pages/Page-Project/Page-Project.vue";
import PageDashboard from "@/pages/Page-Dashboard/Page-Dashboard.vue";
const routes = [
  {
    path: "/Trang-chủ",
    component: App,
    children: [
      {
        path: "/dashboard",
        name: "Dashboard",
        // meta: { requiresAuth: true },
        component: PageDashboard,
      },
      {
        path: "/project",
        name: "Project",
        // meta: { requiresAuth: true },
        component: PageProject,
      },

    ],
  },
  {
    path: "/",
    component: Login,
    children: [
      {
        path: "",
        component: PageLogin,
      }
    ]
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
// router.beforeEach((to, from, next) => {
//   const isAuthenticated = !!localStorage.getItem("token");

//   if (to.meta.requiresAuth && !isAuthenticated) {
//     next("/");
//   } else {
//     next();
//   }
// });

export default router;