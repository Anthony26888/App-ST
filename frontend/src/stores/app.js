// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => {
    return {
      Url: "http://localhost:3000",
      DialogSuccess:false,
      DialogFailure:false,
      DetailOrder : false
    };
  },
  getters: {

  },

  actions: {}
})
