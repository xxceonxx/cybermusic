<template>
  <v-container>
    <v-list width="100%" v-if="!loading">
      <v-card v-for="song in songs" :key="song.id">
        <v-img
          :src="song.attributes.image"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          height="200px"
          @click="goToSong(song)"
        >
          <v-card-title> {{ song.attributes.name }} </v-card-title>
        </v-img>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn icon @click="deleteSong(song.id)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-list>
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
  </v-container>
</template>

<script>
import useMoralis from "@/services/useMoralis.js";
import { onMounted } from "~/composition";
import { mapMutations } from "vuex";
export default {
  methods: {
    ...mapMutations(["SET_song"]),
    goToSong(song) {
      this.SET_song(song);
      this.$router.push("/song");
    },
  },
  setup() {
    const { getSongs, songs, deleteSong, mixSong, loading } = useMoralis();

    onMounted(() => {
      getSongs();
      console.log(songs, "songss");
    });
    return { songs, deleteSong, mixSong, loading };
  },
};
</script>

<style lang="scss" scoped>
</style>