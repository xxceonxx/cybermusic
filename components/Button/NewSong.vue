<template>
  <v-dialog
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
    v-model="dialog"
  >
    <template v-slot:activator="{ on, attrs }" v-bind="attrs" v-on="on">
      <v-card color="green" v-on="on" v-bind="attrs">
        <v-container class="pa-4"
          ><v-row justify="center">
            <v-icon size="140">mdi-folder-plus</v-icon>
            <v-card-title>
              Create a new Song with different instruments!
            </v-card-title></v-row
          >
        </v-container>
      </v-card>
    </template>
    <v-card>
      <v-toolbar
        ><v-toolbar-title>Create a new Song</v-toolbar-title
        ><v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn icon dark @click="dialog = false"
            ><v-icon>mdi-close-thick</v-icon></v-btn
          ></v-toolbar-items
        ></v-toolbar
      >
      <v-card>
        <v-container>
          <v-form ref="form">
            <v-row>
              <v-text-field
                v-model="name"
                label="Songname"
                single-line
              ></v-text-field
            ></v-row>
            <v-row>
              <h2>Duration {{ duration }}</h2></v-row
            >
            <v-row>
              <v-slider max="300" min="0" v-model="duration"> </v-slider
            ></v-row>
            <v-row>
              <h2>BPM {{ bpm }}</h2></v-row
            >
            <v-row>
              <v-slider max="300" min="1" v-model="bpm"> </v-slider
            ></v-row>
          </v-form>
        </v-container>
      </v-card>

      <v-row justify="center"
        ><v-col md="4">
          <v-btn block color="green" @click="createsong(name, duration, bpm)">
            Create
          </v-btn></v-col
        ></v-row
      >
    </v-card>
  </v-dialog>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
import { watchEffect } from "@vue/composition-api";
export default {
  data() {
    return {
      dialog: false,
      name: "",
      duration: 0,
      bpm: 100,
    };
  },
  setup() {
    const { createSong } = useMoralis();
    function createsong(name, duration, bpm) {
      createSong(name, duration, bpm)
        .then((res) => {
          /* change page */
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return { createsong };
  },
};
</script>

<style lang="scss" scoped>
</style>