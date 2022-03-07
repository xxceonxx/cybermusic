<template>
  <v-list width="100%">
    <v-card v-for="song in songs" :key="song.id">
      <v-dialog
        fullscreen
        hide-overlay
        transition="dialog-bottom-transition"
        v-model="dialog"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-img
            src="https://cdn.vuetifyjs.com/images/cards/house.jpg"
            class="white--text align-end"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            height="200px"
            v-on="on"
            v-bind="attrs"
          >
            <v-card-title> {{ song.attributes.name }} </v-card-title>
          </v-img>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn icon>
              <v-icon>mdi-heart</v-icon>
            </v-btn>

            <v-btn icon>
              <v-icon>mdi-bookmark</v-icon>
            </v-btn>

            <v-btn icon>
              <v-icon>mdi-share-variant</v-icon>
            </v-btn>
          </v-card-actions>
        </template>
        <SongTracks :songid="song.id" />
      </v-dialog>
    </v-card>
  </v-list>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
export default {
  data() {
    return {
      dialog: false,
    };
  },
  setup() {
    const { getSongs, songs } = useMoralis();

    getSongs();

    return { songs };
  },
  methods: {
    goToSong(id) {
      console.log("song id from method", id);
      this.$router.push("/song/");
    },
  },
};
</script>

<style lang="scss" scoped>
</style>