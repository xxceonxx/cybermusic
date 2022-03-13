<template>
  <v-container>
    <v-toolbar color="black"
      ><v-btn @click="$router.back()">back</v-btn>
      <v-spacer></v-spacer>

    </v-toolbar>
    <v-row>
      <v-col md="8" cols="8">
        <SongTracks :song="song" />
      </v-col>
      <v-col md="4" cols="4">
        <SongSlotCard />
      </v-col>
    </v-row>
    <v-col  v-if="access">
      <SongCreateNFT  />
    </v-col>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import useMoralis from "@/services/useMoralis.js";
export default {
  setup(){
       const { isOwner, access } = useMoralis();
       return {isOwner, access}
  },
  mounted(){
    const { isOwner } = useMoralis();
    isOwner(this.GET_song());
  },
  computed: {
    song() {
      return this.GET_song();
    },
  },
  methods: {
    ...mapGetters(["GET_song"]),
  },
};
</script>

<style lang="scss" scoped>
</style>