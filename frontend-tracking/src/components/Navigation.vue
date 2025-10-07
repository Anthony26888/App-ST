<template>
  <v-app-bar :elevation="2">
    <template v-slot:prepend>
      <v-avatar>
        <v-img src="@/assets/avatar-ST.jpg"></v-img>
      </v-avatar>
    </template>

    <v-app-bar-title class="font-weight-bold">Siêu Thuật</v-app-bar-title>

    <template v-slot:append>
      <v-btn icon="mdi-account-circle" class="user-avatar"></v-btn>
    </template>
  </v-app-bar>
</template>
<style scoped>
.font-weight-bold {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-style: italic; 
  font-size: 24px;
  background: linear-gradient(180deg, #9B2C23 0%, #D4602F 50%, #E78C2F 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.user-avatar {
  font-size: 24px;
  color: #9B2C23;
}
</style>
