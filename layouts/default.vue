<template>
  <v-app dark>
    <nav><Header /></nav>
    <v-main>
      <v-container>
        <AuthenticateLogin v-if="!isAuthenticated" />
        <v-btn @click="() => authenticate()" v-if="!isAuthenticated"
          >Login</v-btn
        >
                <v-btn @click="() => signup()" v-if="!isAuthenticated"
          >signup</v-btn
        >

        <Nuxt v-if="isAuthenticated" />
        <v-btn @click="() => logout()" v-if="isAuthenticated">Logout</v-btn>
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
      const { isAuthenticated, authenticate, logout, signup } = useMoralis();
      return { isAuthenticated, authenticate, logout, signup };
    }
  },
};
</script>

