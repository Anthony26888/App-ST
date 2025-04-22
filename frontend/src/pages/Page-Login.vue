<template lang="">
  <v-empty-state width="100%">
    <v-card class="mx-auto my-auto" color="grey-lighten-4" width="400">
      <v-toolbar color="#18222D" flat>
        <v-btn icon="mdi-account"></v-btn>

        <v-toolbar-title class="font-weight-light">Đăng nhập </v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <InputField v-model="Username" label="Tên đăng nhập" />
        <InputField v-model="Password" type="password" label="Mật khẩu" />
        <p v-if="TextError != ''" class="text-red">{{ TextError }}</p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn @click="login()" block variant="tonal" bg-color="#18222D">
          Đăng nhập
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-empty-state>
  <Loading v-model="DialogLoading" />
</template>
<script setup>
import axios from "axios";
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import InputField from "@/components/Input-Field.vue";
import Loading  from "@/components/Loading.vue";
const router = useRouter();
const Url = import.meta.env.VITE_API_URL;
const Username = ref("");
const Password = ref("");
const DialogLoading = ref(false);
const TextError = ref("");

const login = async () => {
  DialogLoading.value = true;
  const formData = {
    Username: Username.value,
    Password: Password.value,
  };
  try {
    const res = await axios.post(`${Url}/Users/login`, formData);

    localStorage.setItem("token", res.data.token);
    FetchUser();
  } catch (err) {
    TextError.value = err.response.data.error;
    DialogLoading.value = false;
  }
};
const FetchUser = async () => {
  try {
    const res = await fetch(`${Url}/All-Users/${Username.value}`);
    const Detail_User = await res.json();
    const LevelUser = Detail_User[0].Level;
    if (LevelUser == "Admin" || LevelUser == "Kế hoạch" || LevelUser == "Quản lý") {
      router.push(`/Kiem-tra-so-lieu`);
      DialogLoading.value = false;
    } else if(LevelUser == "Kinh doanh" || LevelUser == "Thủ kho") {
      DialogLoading.value = false;
      router.push(`/Ton-kho`);
    } else{
      router.push(`/`);
      DialogLoading.value = false;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    DialogLoading.value = false;
  }
};
</script>
<script>
export default {
  components: {
    InputField,
    Loading
  },
  data() {
    return {

    };
  },
  methods: {
  },
};
</script>
<style lang=""></style>
