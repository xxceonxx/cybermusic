<template>
  <v-card color="orange" @click="getTracks(id)" >
    <v-container class="pa-4"
      ><v-row justify="center">
        <v-icon size="140">mdi-pencil</v-icon>
        <v-card-title>
          Load your songs!
        </v-card-title></v-row
      >
    </v-container>
  </v-card>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  data() {
    return {
      id: "69A8oBHTFrH4Fr7RSd9bynLq"
    }
  },
  setup() {
    if (process.client) {
      const { getTracks } = useMoralis();
      return { getTracks };
    }
  },
};
</script>

<style lang="scss" scoped>
</style>