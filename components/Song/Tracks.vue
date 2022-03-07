<template>
  <v-card>
    <v-img
      src="https://cdn.vuetifyjs.com/images/cards/house.jpg"
      class="white--text align-end"
      gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      height="200px"
    >
      <v-card-title> Name </v-card-title>
    </v-img>
    <v-list width="100%">
      <!-- <wavesurfer :src="file" :options="options"></wavesurfer> -->
      <v-toolbar dense>
        <v-toolbar-title>Toolbar</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn @click="play"><v-icon>mdi-play</v-icon></v-btn>
        <v-btn @click="pause"><v-icon>mdi-pause</v-icon></v-btn>
        <v-btn @click="stop"><v-icon>mdi-stop</v-icon></v-btn>
        <v-btn disabled>{{ timer }}</v-btn>
        <v-spacer></v-spacer>
        <v-btn><v-icon>mdi-menu</v-icon></v-btn>
      </v-toolbar>
      <v-list-item v-for="track in tracks" :key="track.id">
        <v-list-item-avatar>
          <v-icon>mdi-atom-variant</v-icon>
        </v-list-item-avatar>
        <v-spacer></v-spacer>
        <v-list-item-content>
          <v-list-item-title>
            {{ track.attributes.instrument }}
          </v-list-item-title>
        </v-list-item-content>
        <v-list-item-content>
          {{ track.attributes.ipfsUrl }}
        </v-list-item-content>
        <SongUploadTrack :songid="songid" />
        <SongDeleteInstrument />
      </v-list-item>
      <SongAddTrack :songid="songid" /> </v-list
  >
  <v-text-field v-model="instrument"></v-text-field>
  <v-btn @click="updateInstrumentName(instrument, tracks[0].id)">test</v-btn>
  </v-card>
</template>

<script>
import { Howl, Howler } from "howler";
import useMoralis from "@/services/useMoralis.js";
import { ref, watch } from "@vue/composition-api";
export default {
  data() {
    return {
      instrument: ""
    }
  },
  props: ["songid"],
  setup(props) {
    const { getTracks, tracks, updateInstrumentName } = useMoralis();
    const howlTracks = ref([]);
    let timer = ref("00:00");
    let interval = null;
    getTracks(props.songid);

    function formatTime(secs) {
      var minutes = Math.floor(secs / 60) || 0;
      var seconds = Math.floor(secs - minutes * 60) || 0;

      return (
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds
      );
    }

    watch(
      () => tracks.value,
      () => {
        console.log("changed!!!!!!!!!!");
        loadSongs();
      }
    );

    function loadSongs() {
      const prepareHowlTracks = [];
      for (let key in tracks.value) {
        let howl = new Howl({
          src: [tracks.value[key].attributes.ipfsUrl],
          preload: true,
          html5: true,
          onload() {
            console.log("Track 123 loaded");
          },
          onplay() {
            interval = setInterval(function () {
              timer.value = formatTime(howl.seek());
            }, 300);
          },
        });
        prepareHowlTracks.push(howl);
      }
      console.log("the tracks:", howlTracks);

      howlTracks.value = prepareHowlTracks;
    }

    function play() {
      console.log(howlTracks.value, "howltrckasdaf");
      for (let key in howlTracks.value) {
        howlTracks.value[key].play();
      }
    }
    function pause() {
      for (let key in howlTracks.value) {
        howlTracks.value[key].pause();
        clearInterval(interval);
      }
    }
    function stop() {
      for (let key in howlTracks.value) {
        howlTracks.value[key].stop();
      }
    }

    loadSongs();
    return { tracks, play, pause, stop, timer, updateInstrumentName };
  },
};
</script>

<style lang="scss" scoped>
</style>