<template>
  <v-dialog
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
    v-model="dialog"
  >
    <template v-slot:activator="{ on, attrs }" v-bind="attrs" v-on="on">
      <v-card color="blue" v-on="on" v-bind="attrs">
        <v-container class="pa-4"
          ><v-row justify="center">
            <v-icon size="140">mdi-slot-machine-outline</v-icon>
            <v-card-title> Play create a song game </v-card-title></v-row
          >
        </v-container>
      </v-card>
    </template>
    <v-card>
      <v-toolbar
        ><v-toolbar-title>choose your instruments</v-toolbar-title
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
              <v-col v-for="instrument in instruments" :key="instrument.name">
                <v-checkbox
                  v-model="instrument.taken"
                  :label="instrument.name"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card>

      <v-row justify="center"
        ><v-col md="4">
          <v-btn block color="green" @click="newGame()"> Play </v-btn></v-col
        ></v-row
      >
    </v-card>
  </v-dialog>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
import { Rive, Layout } from "@rive-app/webgl";
export default {
  data() {
    return {
      dialog: false,
      name: "",
      duration: 0,
      bpm: 100,
      rive: null,
      instruments: [
        { name: "Guitar", icon: "iconName", taken: false },
        { name: "Drums", icon: "iconName", taken: false },
        { name: "Keys", icon: "iconName", taken: false },
        { name: "Horns", icon: "iconName", taken: false },
      ],
    };
  },
  methods: {
    play() {
      console.log("play");
      this.rive.play("Drum");
    },
  },
  setup() {
    if (process.client) {
      const { startGame } = useMoralis();

      function newGame() {
        let choosenInstruments = [];
        for (let key in this.instruments) {
          if (this.instruments[key].taken) {
            choosenInstruments.push(this.instruments[key].name);
          }
        }
        startGame(choosenInstruments).then((song) => {
          if (song) {
            this.$store.commit("SET_song", song);
            this.$router.push("/song");
          }
        });
      }

      return { newGame };
    }
  },

  mounted() {
    this.rive = new Rive({
      canvas: this.$refs.riveAnimation,
      animations: "Wait",
      src: "https://public.rive.app/community/runtime-files/2256-4461-slot-machine.riv",
      layout: new Layout({}),
      autoplay: true,
    });
  },
};
</script>

<style lang="scss" scoped>
</style>