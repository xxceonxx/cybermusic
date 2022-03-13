<template>
  <v-app dark>
    <Navbar />
    <v-main>
      <v-container>
        <AuthenticateLogin v-if="!isAuthenticated" />
        <Nuxt v-if="isAuthenticated" />
      </v-container>
    </v-main>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script>
import useMoralis from "../services/useMoralis.js";
import { ref, watchEffect } from "@/composition";
export default {
  setup() {
    if (process.client) {
      const { isAuthenticated, authenticate, logout, signup } =
        useMoralis();
      return { isAuthenticated, authenticate, logout, signup };
    }
  },
};
</script>

