<template>
  <v-container
    ><v-card>
      <v-card>
        <v-list width="100%">
          <!-- <wavesurfer :src="file" :options="options"></wavesurfer> -->
          <v-toolbar dense >
            <v-toolbar-title>{{ song.attributes.name }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="play"><v-icon>mdi-play</v-icon></v-btn>
            <v-btn @click="pause"><v-icon>mdi-pause</v-icon></v-btn>
            <v-btn @click="stop"><v-icon>mdi-stop</v-icon></v-btn>
            <v-spacer></v-spacer>
            <v-btn disabled>{{ timer }} // {{ duration }}</v-btn>
          </v-toolbar>
          <v-list-item v-for="(track, key) in tracks" :key="key">
            <v-list-item-avatar tile>
              <svg-icon :name="getSVG(track.attributes.instrument)" />
            </v-list-item-avatar>

            <v-col>
              <v-list-item-content>
                {{ track.attributes.instrument }}
              </v-list-item-content>
            </v-col>

            <v-list-item-content>
              <v-progress-linear :color="track.attributes.ipfsUrl ? `blue` : `grey`"
                :value="progress[key].progress"
              ></v-progress-linear>
            </v-list-item-content>
            <SongUploadTrack
              :trackId="track.id"
              :songId="song.id"
              v-if="access"
            />
            <SongDeleteTrack
              :trackId="track.id"
              :songId="song.id"
              v-if="access"
            />
          </v-list-item>
        </v-list>
      </v-card>
    </v-card>
    <v-card
      ><v-card-title
        ><SongAddTrack :songid="song.id" v-if="access" /></v-card-title
    ></v-card>
    <v-card
      ><v-row justify="center">
        <v-card v-for="(track, index) in howlTracks" :key="index">
          <v-slider
            @change="volume(index, volumeSliders[index].volume)"
            v-model="volumeSliders[index].volume"
            vertical
            min="0"
            max="100"
          >
          </v-slider>
          <v-card-title>{{ volumeSliders[index].instrument }}</v-card-title>
        </v-card>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { Howl, Howler } from "howler";
import useMoralis from "@/services/useMoralis.js";
import { ref, watch } from "@vue/composition-api";
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      instrument: "",
    };
  },
  methods: {
    ...mapGetters(["GET_song"]),
    getSVG(instrument) {
      var instruments = [
        { name: "Bass", svg: "bass" },
        { name: "AGuitar", svg: "aguitar" },
        { name: "EGuitar", svg: "eguitar" },
        { name: "Drum", svg: "drum" },
        { name: "Harp", svg: "harp" },
        { name: "Flute", svg: "flute" },
        { name: "Percussion", svg: "percussion" },
        { name: "Piano", svg: "piano" },
        { name: "Saxophone", svg: "saxophone" },
        { name: "Triangle", svg: "triangle" },
        { name: "Violin", svg: "violin" },
        { name: "Vocals", svg: "vocals" },
      ];
      const svg = instruments.find((element) => element.name === instrument);
      return svg.svg;
    },
    updateName(track, song) {
      updateInstrumentName(this.instrument, track.id, song.id);
      this.instrument = "";
    },
  },
  props: ["song"],
  setup(props) {
    const { getTracks, tracks, updateInstrumentName, mixSong, access } =
      useMoralis();
    const howlTracks = ref([]);
    let timer = ref("00:00");
    let interval = null;
    let progress = ref([]);
    let volumeSliders = ref([]);
    let duration = ref();

    getTracks(props.song.id);
    setDuration();
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
        progress.value.push({ progress: 0 });
        volumeSliders.value.push({
          id: key,
          volume: 50,
          instrument: tracks.value[key].attributes.instrument,
        });
        let howl = new Howl({
          src: [tracks.value[key].attributes.ipfsUrl],
          preload: true,
          html5: true,
          volume: 0.5,
          onload() {
            console.log("Track 123 loaded");
          },
          onplay() {
            interval = setInterval(function () {
              timer.value = formatTime(howl.seek());
              progress.value[key].progress =
                (props.song.attributes.duration * howl.seek()) / 100;
            }, 300);
          },
        });
        prepareHowlTracks.push(howl);
        console.log(howl);
      }
      howlTracks.value = prepareHowlTracks;
    }

    function play() {
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

    function volume(id, percentage) {
      console.log(percentage / 100);
      howlTracks.value[id].volume(percentage / 100);
    }

    function setDuration() {
      duration.value = formatTime(props.song.attributes.duration);
    }

    loadSongs();
    return {
      tracks,
      play,
      pause,
      stop,
      timer,
      updateInstrumentName,
      progress,
      howlTracks,
      volume,
      volumeSliders,
      duration,
      mixSong,
      access,
    };
  },
};
</script>

<style lang="scss" scoped>
</style>