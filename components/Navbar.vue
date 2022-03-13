<template>
  <v-app-bar app color="#111111" dark flat class="px-8">
    <v-btn text class="yellow--text">
     Cyber Music
    </v-btn>
    <v-spacer />
    <v-btn text @click="scroll('home')">Home</v-btn>
    <v-spacer />
    <v-btn @click="() => authenticate()" v-if="!isAuthenticated">Login</v-btn>
    <v-btn @click="() => signup()" v-if="!isAuthenticated">signup</v-btn>
    <v-btn @click="() => logout()" v-if="isAuthenticated">Logout</v-btn>
  </v-app-bar>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  setup() {
    const { isAuthenticated, authenticate, logout, signup } = useMoralis();
    return { isAuthenticated, authenticate, logout, signup };
  },
  methods: {
    scroll(ref) {
      const element = document.getElementById(ref);
      element.scrollIntoView({ behavior: "smooth" });
    },
  },
};
</script>

<style lang="scss" scoped>
</style>