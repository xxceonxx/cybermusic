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
            <v-icon color="green">mdi-upload</v-icon>
          </v-btn>
        </v-col>
      </v-list-item-icon></template
    >

    <v-card>
      <v-toolbar>
        <v-toolbar-title>Upload a new file</v-toolbar-title
        ><v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon dark @click="dialog = false"
            ><v-icon>mdi-close-thick</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-container v-if="!loading">
        <v-col>
          <v-container>
            <v-form>
              <v-file-input @change="selectFile" type="file"></v-file-input>
              <v-btn @click="uploadTrack(file, trackId, songId)">Upload </v-btn>
            </v-form>
          </v-container>
        </v-col>
      </v-container>
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
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  setup() {
    if (process.client) {
      const { uploadTrack, getSongById, loading } = useMoralis();
      return { uploadTrack, getSongById, loading };
    }
  },
  data() {
    return {
      instrument: "new",
      dialog: false,
      file: undefined,
    };
  },
  props: ["trackId", "songId"],
  methods: {
    selectFile(file) {
      console.log(this.songid);
      console.log(file);
      this.file = file;
    },
  },
};
</script>

<style lang="scss" scoped>
</style>