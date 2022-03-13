<template>
  <v-card class="pa-5">
    <v-img
      contain
      height="100%"
      :src="currentTrack.attributes.ipfsUrl ? instrument.image : instrument.imageGrey"
      transition="slide-x-transition"
    >
      <v-container fill-height class="justify-center">
        <v-card-actions>
          <v-dialog
            hide-overlay
            transition="dialog-bottom-transition"
            v-model="dialog"
            max-width="70vh"
            ><template v-slot:activator="{ on }">
              <v-btn icon color="green" v-on="on"
                >
                <v-icon size=100 v-if="currentTrack.attributes.ipfsUrl">mdi-reload</v-icon>
                <v-icon size="100" v-if="!currentTrack.attributes.ipfsUrl">mdi-upload</v-icon>
                </v-btn
              >
            </template>

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
                      <v-file-input
                        @change="selectFile"
                        type="file"
                      ></v-file-input>
                      <v-btn
                        @click="uploadTrack(file, currentTrack.id, song.id)"
                        >Upload
                      </v-btn>
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
          </v-dialog> </v-card-actions
      ></v-container> </v-img
  ></v-card>
</template>

<script>
import { mapGetters } from "vuex";
import useMoralis from "@/services/useMoralis.js";
export default {
  data() {
    return {
      locked: true,
      nlocked: true,
      dialog: false,
      instruments: [
        {
          name: "Bass",
          image: `${require(`~/assets/instruments/Bass-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Bass-xl-greyscale.jpg`)}`,
        },
        {
          name: "AGuitar",
          image: `${require(`~/assets/instruments/AGuitar-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/AGuitar-xl-greyscale.jpg`)}`,
        },
        {
          name: "EGuitar",
          image: `${require(`~/assets/instruments/EGuitar-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/EGuitar-xl-greyscale.jpg`)}`,
        },
        {
          name: "Drum",
          image: `${require(`~/assets/instruments/Drums-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Drums-xl-greyscale.jpg`)}`,
        },
        {
          name: "Harp",
          image: `${require(`~/assets/instruments/Harp-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Harp-xl-greyscale.jpg`)}`,
        },
        {
          name: "Flute",
          image: `${require(`~/assets/instruments/Flute-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Harp-xl-greyscale.jpg`)}`,
        },
        {
          name: "Percussion",
          image: `${require(`~/assets/instruments/Percussion-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Percussion-xl-greyscale.jpg`)}`,
        },
        {
          name: "Piano",
          image: `${require(`~/assets/instruments/Piano-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Piano-xl-greyscale.jpg`)}`,
        },
        {
          name: "Saxophone",
          image: `${require(`~/assets/instruments/Saxophone-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Saxophone-xl-greyscale.jpg`)}`,
        },
        {
          name: "Triangle",
          image: `${require(`~/assets/instruments/Triangle-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Triangle-xl-greyscale.jpg`)}`,
        },
        {
          name: "Violin",
          image: `${require(`~/assets/instruments/Violine-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Violine-xl-greyscale.jpg`)}`,
        },
        {
          name: "Vocals",
          image: `${require(`~/assets/instruments/Vocals-xl.jpg`)}`,
          imageGrey: `${require(`~/assets/instruments/Vocals-xl-greyscale.jpg`)}`,
        },
      ],
    };
  },
  setup() {
    const { uploadTrack, loading, currentTrack } = useMoralis();
    return { uploadTrack, loading, currentTrack };
  },
  computed: {
    instrument() {
      var instrument = this.GET_instrument();
      if (!instrument) {
        return {
          name: "NO Instrument",
          image: `${require(`~/assets/instruments/Bass-xl.jpg`)}`,
        };
      } else {
        console.log(instrument, "the instrument");
        var index = this.instruments.findIndex(
          (element) => element.name == instrument
        );
        console.log(index, "INDEXXXXXXX");
        return this.instruments[index];
      }
    },
    song() {
      return this.GET_song();
    },
  },
  methods: {
    ...mapGetters(["GET_instrument"]),
    ...mapGetters(["GET_song"]),
    selectFile(file) {
      console.log(this.songid);
      console.log(file);
      this.file = file;
    },
  },
};
</script>

<style scoped>
</style>

