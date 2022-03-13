<template>
  <v-row justify="center">
    <v-col v-for="(n, key) in currentIndex" :key="key" cols="4">
      <v-col md="10">
        <v-row>
          <v-carousel
            hide-delimiter-background
            hide-delimiters
            :show-arrows="false"
            height="auto"
            ref="carousel"
            v-model="currentIndex[key].index"
          >
            <v-carousel-item
              v-for="instrument in instruments"
              :key="instrument.name"
            >
              <p class="blue--text text-center text-uppercase font-weight-bold">
                {{ instrument.name }}
              </p>
              <v-img
                :src="instrument.image"
                transition="slide-x-transition"
                :class="{ locked: !n.isLocked }"
              ></v-img>
            </v-carousel-item>
          </v-carousel>
        </v-row>

        <v-row justify="space-around" class="pt-5">
          <v-btn icon :disabled="n.isLocked"
            ><v-icon x-large color="pink" @click="$refs.carousel[key].prev()"
              >mdi-arrow-left-bold-hexagon-outline</v-icon
            ></v-btn
          >

          <v-btn icon :disabled="n.isLocked"
            ><v-icon x-large color="pink" @click="$refs.carousel[key].next()"
              >mdi-arrow-right-bold-hexagon-outline</v-icon
            ></v-btn
          >
        </v-row>
        <v-row justify="space-around" class="pt-2">
          <v-btn color="green" outlined @click="lockInstrument(n)">
            {{ n.isLocked ? "Unlock" : "Lock" }}
          </v-btn>
        </v-row>
      </v-col>
    </v-col>
  </v-row>
</template>

<script>
import { mapMutations } from "vuex";
export default {
  data() {
    return {
      currentIndex: [],
      /*   lockedInstruments: [], */
      instruments: [
        {
          name: "Bass",
          image: `${require(`~/assets/instruments/Bass-md.jpg`)}`,
        },
        {
          name: "A. Guitar",
          image: `${require(`~/assets/instruments/AGuitar-md.jpg`)}`,
        },
        {
          name: "E. Guitar",
          image: `${require(`~/assets/instruments/EGuitar-md.jpg`)}`,
        },
        {
          name: "Drum",
          image: `${require(`~/assets/instruments/Drums-md.jpg`)}`,
        },
        {
          name: "Harp",
          image: `${require(`~/assets/instruments/Harp-md.jpg`)}`,
        },
        {
          name: "Flute",
          image: `${require(`~/assets/instruments/Flute-md.jpg`)}`,
        },
        {
          name: "Percussion",
          image: `${require(`~/assets/instruments/Percussion-md.jpg`)}`,
        },
        {
          name: "Piano",
          image: `${require(`~/assets/instruments/Piano-md.jpg`)}`,
        },
        {
          name: "Saxophone",
          image: `${require(`~/assets/instruments/Saxophone-md.jpg`)}`,
        },
        {
          name: "Triangle",
          image: `${require(`~/assets/instruments/Triangle-md.jpg`)}`,
        },
        {
          name: "Violin",
          image: `${require(`~/assets/instruments/Violine-md.jpg`)}`,
        },
        {
          name: "Vocals",
          image: `${require(`~/assets/instruments/Vocals-md.jpg`)}`,
        },
      ],
    };
  },
  methods: {
    ...mapMutations(["Add_lockedInstrument", "Delete_lockedInstrument"]),
    lockInstrument(n) {
      if (n.isLocked) {
        console.log(this.$store.getters.GET_lockedInstruments);
        this.Delete_lockedInstrument(this.instruments[n.index].name);
        n.isLocked = false;
      } else {
        this.Add_lockedInstrument(this.instruments[n.index].name);
        n.isLocked = true;
      }
    },
  },
  created() {
    for (var i = 0; i < 3; i++) {
      this.currentIndex.push({
        index: Math.floor(Math.random() * 12),
        isLocked: false,
      });
    }

    console.log(this.currentIndex, "instr");
  },
};
</script>

<style lang="scss" scoped>
.locked {
  filter: grayscale(100%);
}
</style>