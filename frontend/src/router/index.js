// Composables
import { createRouter, createWebHistory } from "vue-router";
import App from "@/layouts/default.vue"
import Login from "@/layouts/login.vue"
import PageCheck from "@/pages/Page-Check/Page-Check.vue"
import PageListProject from "@/pages/Page-Check/Page-List-Project.vue";
import PageCheckPnP from "@/pages/Page-Check/Page-Check-PnP.vue"
import PageWareHouse from "@/pages/Page-Warehouse/Page-WareHouse.vue";
import PageWareHouse2 from "@/pages/Page-Warehouse/Page-WareHouse-2.vue";
import PageOrders from "@/pages/Page-Orders/Page-Orders.vue";
import PageSetting from "@/pages/Page-Setting/Page-Setting.vue";
import PageLogin from "@/pages/Page-Setting/Page-Login.vue";
import PageUsers from "@/pages/Page-Setting/Page-Users.vue"
import PageReg from "@/pages/Page-Setting/Page-Reg.vue";
import PageEditBom from "@/pages/Page-Check/Page-EditBom.vue";
import PageDetailOrders from "@/pages/Page-Orders/Page-DetailOrders.vue";
import PageProject from "@/pages/Page-Project/Page-Project.vue";
import PageProjectDetail from "@/pages/Page-Project/Page-DetailProject.vue";
import PagePODetail from "@/pages/Page-Project/Page-DetailProjectPO.vue"
import PageMaintenance from "@/pages/Page-Maintaince/Page-Maintenance.vue";
import PageDetailMaintenance from "@/pages/Page-Maintaince/Page-DetailMaintenance.vue";
import PageMaintenanceSchedule from "@/pages/Page-Maintaince/Page-MaintenanceSchedule.vue";
import PageSparePartUsage from "@/pages/Page-Maintaince/Page-SparePartUsage.vue";
import PagePlanProduct from "@/pages/Page-Manufacture/Page-Manufacture.vue";
import PageDetailManufacture from "@/pages/Page-Manufacture/Page-DetailManufacture.vue";
import PageDetailSMT from "@/pages/Page-Manufacture/Page-DetailSMT.vue";
import PageDetailAOI from "@/pages/Page-Manufacture/Page-DetailAOI.vue";
import PageDetailRW from "@/pages/Page-Manufacture/Page-DetailRW.vue";
import PageDetailIPQC from "@/pages/Page-Manufacture/Page-DetailIPQC.vue";
import PageDetailAssembly from "@/pages/Page-Manufacture/Page-DetailAssembly.vue";
import PageDetailOQC from "@/pages/Page-Manufacture/Page-DetailOQC.vue";
import PageSummary from "@/pages/Page-Summary/Page-Summary.vue"
import PageDetailIPQCSMT from "@/pages/Page-Manufacture/Page-Detail-IPQC-SMT.vue";
import PageDetailBoxBuild from "@/pages/Page-Manufacture/Page-Detail-BoxBuild.vue";
import PageDetailWarehouse from "@/pages/Page-Manufacture/Page-Detail-Warehouse.vue";
import PageDetailTest1 from "@/pages/Page-Manufacture/Page-Detail-Test1.vue";
import PageDetailTest2 from "@/pages/Page-Manufacture/Page-Detail-Test2.vue";
import PageListWork from "@/pages/Page-Manufacture/Page-ListWork.vue";
import PageAI from "@/pages/Page-AI-Chatbox/Page-AI.vue"
import PageDetailConformalCoating from "@/pages/Page-Manufacture/Page-Detail-Conformal-Coating.vue";


const routes = [
  {
    path: "/Trang-chủ",
    component: App,
    children: [
      {
        path: "/Du-an",
        name: "Project",
        meta: { requiresAuth: true },
        component: PageProject,
      },
      {
        path: "/Du-an/Khach-hang/:id",
        name: "Project_Detail",
        meta: { requiresAuth: true },
        component: PageProjectDetail,
      },
      {
        path: "/Du-an/Don-hang/:id",
        name: "PO_Detail",
        meta: { requiresAuth: true },
        component: PagePODetail,
      },
      {
        path: "/Kiem-tra-so-lieu",
        name: "Check",
        meta: { requiresAuth: true },
        component: PageCheck,
      },
      {
        path: "/Chinh-sua-so-lieu",
        name: "EditCheck",
        meta: { requiresAuth: true },
        component: PageEditBom,
      },
      {
        path: "/Danh-sach-pnp",
        name: "ListPnP",
        meta: { requiresAuth: true },
        component: PageListProject,
      },
      {
        path: "/Kiem-tra-so-lieu-pnp/:id",
        name: "CheckPnP",
        meta: { requiresAuth: true },
        component: PageCheckPnP,
      },
      {
        path: "/Ton-kho",
        name: "WareHouse",
        meta: { requiresAuth: true },
        component: PageWareHouse,
      },
      {
        path: "/Ton-kho-2",
        name: "WareHouse-2",
        meta: { requiresAuth: true },
        component: PageWareHouse2,
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
        path: "/Don-hang/:id",
        name: "DetailOrder",
        meta: { requiresAuth: true },
        component: PageDetailOrders,
      },
      {
        path: "/Bao-tri",
        name: "Maintenance",
        meta: { requiresAuth: true },
        component: PageMaintenance,
      },
      {
        path: "/Bao-tri/Chi-tiet/:id",
        name: "DetailMaintenance",
        meta: { requiresAuth: true },
        component: PageDetailMaintenance,
      },
      {
        path: "/Bao-tri/Lich-bao-tri/:id",
        name: "MaintenanceSchedule",
        meta: { requiresAuth: true },
        component: PageMaintenanceSchedule,
      },
      {
        path: "/Bao-tri/Chi-tiet-su-dung-phu-tung/:id",
        name: "SparePartUsage",
        meta: { requiresAuth: true },
        component: PageSparePartUsage,
      },
      {
        path: "/San-xuat",
        name: "Manufacture",
        meta: { requiresAuth: true },
        component: PagePlanProduct,
      },
      {
        path: "/San-xuat/Chi-tiet/:id",
        name: "DetailManufacture",
        meta: { requiresAuth: true },
        component: PageDetailManufacture,
      },
      {
        path: "/San-xuat/SMT/:id",
        name: "DetailSMT",
        meta: { requiresAuth: true },
        component: PageDetailSMT,
      },
      {
        path: "/San-xuat/AOI/:id",
        name: "DetailAOI",
        meta: { requiresAuth: true },
        component: PageDetailAOI,
      },
      {
        path: "/San-xuat/RW/:id",
        name: "DetailHand",
        meta: { requiresAuth: true },
        component: PageDetailRW,
      },
      {
        path: "/San-xuat/IPQC/:id",
        name: "DetailIPQC",
        meta: { requiresAuth: true },
        component: PageDetailIPQC,
      },
      {
        path: "/San-xuat/Assembly/:id",
        name: "DetailAssembly",
        meta: { requiresAuth: true },
        component: PageDetailAssembly,
      },
      {
        path: "/San-xuat/OQC/:id",
        name: "DetailOQC",
        meta: { requiresAuth: true },
        component: PageDetailOQC,
      },
      {
        path: "/San-xuat/IPQCSMT/:id",
        name: "DetailIPQCSMT",
        meta: { requiresAuth: true },
        component: PageDetailIPQCSMT,
      },
      {
        path: "/San-xuat/Test1/:id",
        name: "DetailTest1",
        meta: { requiresAuth: true },
        component: PageDetailTest1,
      },
      {
        path: "/San-xuat/Test2/:id",
        name: "DetailTest2",
        meta: { requiresAuth: true },
        component: PageDetailTest2,
      },
      {
        path: "/San-xuat/Nhap-kho/:id",
        name: "DetailWarehouse",
        meta: { requiresAuth: true },
        component: PageDetailWarehouse,
      },
      {
        path: "/San-xuat/BoxBuild/:id",
        name: "DetailBoxBuild",
        meta: { requiresAuth: true },
        component: PageDetailBoxBuild,
      },
      {
        path: "/San-xuat/Conformal-Coating/:id",
        name: "DetailConformalCoating",
        meta: { requiresAuth: true },
        component: PageDetailConformalCoating,
      },
      {
        path: "/Bao-cao-san-xuat",
        name: "Summary",
        meta: { requiresAuth: true },
        component: PageSummary,
      },
      {
        path: "/Danh-sach-cong-viec",
        name: "ListWork",
        meta: { requiresAuth: true },
        component: PageListWork,
      },
      {
        path: "/AI-Chatbox",
        name: "AIChatbox",
        meta: { requiresAuth: true },
        component: PageAI,
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
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;