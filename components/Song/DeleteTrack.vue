<template>
  <v-dialog
    hide-overlay
    transition="dialog-bottom-transition"
    v-model="dialog"
    max-width="70vh"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-list-item-icon class="pl-10" v-bind="attrs" v-on="on">
        <v-col>
          <v-btn icon>
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </v-col>
      </v-list-item-icon></template
    >
    <v-container v-if="!loading">
      <v-toolbar
        ><v-toolbar-title>Are you sure to delte this track?</v-toolbar-title
        ><v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon dark @click="dialog = false"
            ><v-icon>mdi-close-thick</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-card>
        <v-container>
          <p>maybe here can happen some special stuff---if not delete this</p>
        </v-container>
      </v-card>
      <v-row justify="center">
        <v-btn color="red" @click="deleteTrack(trackId, songId)">delete</v-btn>
      </v-row></v-container
    >

     <v-container v-if="loading">
          <v-row justify="center" class="pa-md-12 mx-lg-auto">
            <v-col cols="6">
              <v-progress-linear
                color="deep-purple accent-4"
                indeterminate
                rounded
                height="6"
              ></v-progress-linear> </v-col
          ></v-row>
        </v-container>
  </v-dialog>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  props: ["trackId", "songId"],
  setup() {
     const { deleteTrack, loading } = useMoralis();
     return {deleteTrack, loading}
  },
  data() {
    return {
      dialog: false,
    };
  },
};
</script>

<style lang="scss" scoped>
</style>