<template>
  <v-dialog
    max-width="500"
    hide-overlay
    transition="dialog-bottom-transition"
    v-model="dialog"
  >
    <template v-slot:activator="{ on, attrs }" v-bind="attrs" v-on="on">
      <canvas
        ref="riveAnimation"
        width="600"
        height="600"
        @click="setupGame"
      ></canvas>
    </template>
    <v-card v-if="!fail">
      <v-card-title class="text-h5 text-center"
        ><v-icon>mdi-party-popper</v-icon><v-icon>mdi-party-popper</v-icon
        ><v-icon>mdi-party-popper</v-icon> YOU WON
        <v-icon>mdi-party-popper</v-icon><v-icon>mdi-party-popper</v-icon
        ><v-icon>mdi-party-popper</v-icon>
      </v-card-title>

      <v-card-text>This is a win. You play {{ instrument }}.</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="dialog = false">
          Pass
        </v-btn>
        <v-btn color="green darken-1" text @click="goToSong()">
          Take it!
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-if="fail">
      <v-card-title class="text-h5 text-center">No win :( </v-card-title>

      <v-card-text
        >This time we can`t find a song for you. Maybe try it again with an
        other instrument?</v-card-text
      >
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="dialog = false">
          CLOSE
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { Rive, Layout } from "@rive-app/webgl";
import useMoralis from "@/services/useMoralis.js";
import { ref } from "@/composition";
export default {
  data() {
    return {
      rive: null,
    };
  },
  methods: {
    goToSong() {
      this.$router.push("/song");
    },
  },

  setup() {
    const { startGame } = useMoralis();
    const dialog = ref(false);
    const instrument = ref();
    const fail = ref();
    function setupGame() {
      console.log(this.$store.getters.GET_lockedInstruments);
      startGame(this.$store.getters.GET_lockedInstruments).then((res) => {
        fail.value = false;
        if (!res.song) {
          this.rive.play("fail");
          fail.value = true;
          setTimeout((event) => {
            dialog.value = true;
          }, 10000);
        } else {
          console.log("slotmachein: ", res.song, res.instrument);
          this.$store.commit("SET_instrument", res.instrument);
          this.$store.commit("SET_song", res.song);
          this.$store.commit("SET_lockedInstruments", []);
          console.log(res.instrument, "instrear");
          this.rive.play(res.instrument);
          instrument.value = res.instrument;
          setTimeout((event) => {
            dialog.value = true;
          }, 10000);
        }
      });
    }

    return { setupGame, dialog, instrument, fail };
  },

  mounted() {
    this.rive = new Rive({
      canvas: this.$refs.riveAnimation,
      animations: "Wait",
      src: "https://public.rive.app/community/runtime-files/2263-4476-casino-slot-machine.riv",
      layout: new Layout({}),
      autoplay: true,
    });
  },
};
</script>

<style lang="scss" scoped>
</style>