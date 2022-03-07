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
            <v-icon color="green">mdi-plus-thick</v-icon>
          </v-btn>
        </v-col>
      </v-list-item-icon></template
    >

    <v-container>
      <v-card
        ><v-toolbar
          ><v-toolbar-title>Upload a new file</v-toolbar-title
          ><v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn icon dark @click="dialog = false"
              ><v-icon>mdi-close-thick</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-col>
          <v-container>
            <v-form>
              <v-file-input @change="selectFile" type="file"></v-file-input>
              <v-btn @click="createTrack(instrument, file, songid)">Submit</v-btn>
            </v-form>
          </v-container>
        </v-col>
        <v-row justify="center">
          <v-btn color="green">create</v-btn>
        </v-row></v-card
      >
    </v-container>
  </v-dialog>
</template>

<style lang="scss" scoped>
</style>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  setup() {
    if (process.client) {
      const { createTrack, getSongById } = useMoralis();
      return { createTrack, getSongById };
    }
  },
  data() {
    return {
      instrument: "new",
      dialog: false,
      file: undefined,
    };
  },
  props: ["songid"],
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