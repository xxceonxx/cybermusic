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
        <v-container v-if="!loading">
          <v-form ref="form">
            <v-row>
              <v-col>
                <v-select
                  :items="instruments"
                  label="Instrument"
                  dense
                  v-model="instrument"
                ></v-select>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-file-input
                  @change="selectFile"
                  type="file"
                ></v-file-input></v-col
            ></v-row>
          </v-form>
          <v-row justify="center">
            <v-btn color="green" @click="addTrack(instrument, file, songid)"
              >create</v-btn
            >
          </v-row>
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
      instruments: [
        "Bass",
        "AGuitar",
        "EGuitar",
        "Drum",
        "Harp",
        "Flute",
        "Percussion",
        "Piano",
        "Saxophone",
        "Triangle",
        "Violin",
        "Vocals",
      ],
    };
  },
  props: ["songid"],
  setup() {
    if (process.client) {
      const { loading } = useMoralis();
      return { loading };
    }
  },
  methods: {
    addTrack(instrument, file, songid) {
      const { createTrack } = useMoralis();
      createTrack(instrument, file, songid).then((res) => {
        this.dialog = false;
        this.file = null;
        this.instrument = ""
      });
    },
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