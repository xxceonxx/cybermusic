<template>
  <v-container>
    <v-row>
      <v-col><ButtonsNewSong /> </v-col>
      <v-col>
        <ButtonsEditSong />
      </v-col>
    </v-row>
    <v-row>
      <Song />
    </v-row>
<!--     <v-row>
      <SongExamplePlayer />
    </v-row> -->
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
      notifications: false,
      sound: true,
      widgets: false,
    };
  },
};
</script>
