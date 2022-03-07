<template>
  <v-dialog
    hide-overlay
    transition="dialog-bottom-transition"
    v-model="dialog"
    max-width="70vh"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-list-item color="success" v-bind="attrs" v-on="on">
        <v-list-item-content
          ><v-row justify="center"> <v-icon>mdi-plus</v-icon></v-row>
        </v-list-item-content>
      </v-list-item>
    </template>
    <v-container>
      <v-toolbar
        ><v-toolbar-title>Add a new Instrument</v-toolbar-title
        ><v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon dark @click="dialog = false"
            ><v-icon>mdi-close-thick</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-card>
        <v-container>
          <v-form ref="form">
            <v-row>
              <v-text-field
                v-model="instrument"
                label="Instrument"
                single-line
              ></v-text-field
            ></v-row>
            <v-file-input @change="selectFile" type="file"></v-file-input>
          </v-form>
        </v-container>
      </v-card>

      <v-row justify="center">
        <v-btn color="green" @click="createTrack(instrument, file, songid)"
          >create</v-btn
        >
      </v-row>
    </v-container>
  </v-dialog>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  data() {
    return {
      dialog: false,
      instrument: "",
    };
  },
  props: ["songid"],
  setup() {
    if (process.client) {
      const { createTrack } = useMoralis();
      return { createTrack };
    }
  },
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