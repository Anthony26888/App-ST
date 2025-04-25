<template lang="">
  <v-navigation-drawer theme="light" permanent color="#18222D">
    <template v-slot:prepend>
      <v-list-item
        lines="two"
        prepend-avatar="https://sieuthuat.vn/wp-content/uploads/2019/06/logo-ST-_-original-02-1.png"
      >
        <template v-slot:title>
          <p class="text-h6 font-weight-light ms-3">{{ UserInfo }}</p>
        </template>
        <template v-slot:subtitle>
          <p class="ms-3">{{ LevelUser }}</p>
        </template>
      </v-list-item>
    </template>
    <v-divider></v-divider>
    <v-list nav>
      <v-list-item
        prepend-icon="mdi mdi-cart-arrow-down"
        title="Kiểm tra số liệu"
        value="Check"
        to="/Kiem-tra-so-lieu"
        :disabled="StatusOption_1"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-warehouse"
        title="Tồn Kho"
        value="WareHouse"
        to="/Ton-kho"
        :disabled="StatusOption_2"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-warehouse"
        title="Tồn Kho Misa"
        value="WareHouse2"
        to="/Ton-kho-2"
        :disabled="StatusOption_3"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-order-bool-descending-variant"
        title="Tình trạng đơn hàng"
        value="Orders"
        to="/Don-hang"
        :disabled="StatusOption_4"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi mdi-notebook-multiple"
        title="Dự án"
        value="Project"
        to="/Du-an"
        :disabled="StatusOption_5"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-cog"
        title="Cài đặt"
        value="Setting"
        to="/Cai-dat"
        :disabled="StatusOption_6"
      ></v-list-item>
    </v-list>
    <template v-slot:append>
      <div class="pa-2">
        <v-btn block @click="LogOut()" class="text-caption"> Đăng xuất </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
  <SnackbarFailed v-model="DialogFailed" />
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import { jwtDecode } from "jwt-decode";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Loading from "@/components/Loading.vue";
import SnackbarFailed from "@/components/Snackbar-Failed.vue";
const Url = import.meta.env.VITE_API_URL;
const router = useRouter();
const UserInfo = ref(null);
const LevelUser = ref("");
const StatusOption_1 = ref(false);
const StatusOption_2 = ref(false);
const StatusOption_3 = ref(false);
const StatusOption_4 = ref(false);
const StatusOption_5 = ref(false);
const StatusOption_6 = ref(false);
const Date_Expired = ref("");
const DialogLoading = ref(false);
const DialogFailed = ref(false);

onMounted(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    UserInfo.value = decoded.Username;
    Date_Expired.value = new Date(decoded.exp * 1000);
    FetchUser();
  } else {
    console.log("Không tìm thấy token!");
    DialogFailed.value = true;
    router.push("/");
  }
});
const LogOut = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("CustomersID");
  localStorage.removeItem("PO");
  router.push("/");
};
const FetchUser = async () => {
  if (UserInfo.value) {
    try {
      const res = await fetch(`${Url}/All-Users/${UserInfo.value}`);
      const Detail_User = await res.json();
      LevelUser.value = Detail_User[0].Level;
      if (LevelUser.value == "Kinh doanh") {
        StatusOption_1.value = true;
        StatusOption_4.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Thủ kho") {
        StatusOption_1.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Kế hoạch") {
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_5.value = true;
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Quản lý") {
        StatusOption_6.value = true;
      } else if (LevelUser.value == "Admin") {
        StatusOption_1.value = false;
        StatusOption_2.value = false;
        StatusOption_3.value = false;
        StatusOption_4.value = false;
        StatusOption_5.value = false;
        StatusOption_6.value = false;
      } else {
        StatusOption_1.value = true;
        StatusOption_2.value = true;
        StatusOption_3.value = true;
        StatusOption_4.value = true;
        StatusOption_6.value = true;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      DialogFailed.value = true;
      router.push("/");
    }
  } else {
    DialogFailed.value = true;
    router.push("/");
  }
};
</script>
<script>
export default {
  components: {
    Loading,
    SnackbarFailed,
  },
  data() {},
  methods: {},
};
</script>
<style lang=""></style>
