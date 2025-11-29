<template>
  <v-dialog max-width="340" persistent>
    <div
      class="loading-card d-flex flex-column align-center justify-center px-6 py-8"
    >
      <v-progress-circular
        :size="50"
        :width="4"
        indeterminate
        color="primary"
        class="glow"
      />

      <p class="text-white text-h6 font-weight-light mt-4">
        Đang xử lý...
      </p>
    </div>
  </v-dialog>
</template>

<script>
export default {
  props: { loading: Boolean },
};
</script>

<style scoped>
.loading-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.glow {
  animation: glow 1.8s infinite ease-in-out;
}

@keyframes glow {
  0% {
    filter: drop-shadow(0 0 2px rgba(72, 149, 239, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 10px rgba(72, 149, 239, 0.8));
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(72, 149, 239, 0.4));
  }
}
</style>
