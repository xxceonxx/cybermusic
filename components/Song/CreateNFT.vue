<template>
  <v-card>
    <v-card-title class="justify-center">Create your Song as NFT</v-card-title>
    <v-stepper v-model="e1" dark>
      <v-stepper-header>
        <v-stepper-step step="1" :complete="e1 > 1">
          Mix your Song!
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step
          step="2"
          :complete="e1 > 2"
          :rules="[
            () => {
              if (confirm) {
                return true;
              } else {
                return false;
              }
            },
          ]"
        >
          Check your Metadata
          <small class="red--text">Song get uneditable after that!</small>
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3" :complete="e1 > 3"> Mint NFT! </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-container>
            <v-row justify="center" align="center"
              ><v-col cols="12">
                <h2>Are you ready to create a mix out of the song?</h2>
                <h4 class="grey--text">
                  We will render your song and upload it directly to IPFS.
                </h4>
                <br />
                <h1 v-if="!loading">Lets Go!</h1>
                <h2 class="red--text" v-if="loading">
                  Song mixing in progress...
                </h2>
                <br />
                <v-btn v-if="!loading" @click="mixSong(song)" color="pink"
                  >Mix Song!</v-btn
                >
                <v-progress-linear
                  v-if="loading"
                  color="deep-purple accent-4"
                  indeterminate
                  rounded
                  height="6"
                ></v-progress-linear>
                <br />
                <br />

                <h3 class="red--text font-weight-bold">
                  The Song will be played and rendered in realtime. Please dont
                  close this browser window until the process is complete.
                </h3>
              </v-col>
            </v-row>
            <v-row justify="space-between" class="pa-3">
              <v-col align-self="start" xs="6" sm="5" md="4" lg="3" xl="2">
              </v-col>
              <v-col
                align-self="end"
                class="text-right"
                xs="6"
                sm="5"
                md="4"
                lg="3"
                xl="2"
              >
                <v-btn
                  v-if="song.attributes.ipfsUrl"
                  color="primary"
                  @click="e1 = 2"
                  >Continue</v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-stepper-content>
        <v-stepper-content step="2">
          <v-container>
            <v-overlay :value="overlay" absolute opacity="100">
              <v-col>
                <h2 class="red--text align-center">
                  After you check your Metadata you cant edit your Song anymore!
                </h2>
              </v-col>
              <v-row align="center" justify="center">
                <v-col cols="1">
                  <v-checkbox
                    v-model="confirm"
                    label="Confirm"
                    color="green"
                    value="Confirm"
                    hide-details
                  >
                  </v-checkbox>
                  <br />
                  <v-btn @click="overlay = false">Go on</v-btn></v-col
                >
              </v-row>
            </v-overlay>
            <v-form ref="form">
              <v-row>
                <v-col md="6">
                  <h3>Songname</h3>
                  <v-text-field
                    v-model="songData.name"
                    label="Songname"
                    single-line
                  ></v-text-field>
                </v-col>

                <v-col>
                  <h3>ETH Address</h3>
                  <v-text-field
                    :value="user.attributes.ethAddress"
                    disabled
                    label="ETH"
                    single-line
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col md="6">
                  <v-row justify="center">
                    <h3>Duration {{ songData.duration }}</h3>
                  </v-row>
                  <v-row>
                    <v-slider max="300" min="0" v-model="songData.duration">
                    </v-slider>
                  </v-row>
                </v-col>
                <v-col md="6">
                  <v-row justify="center">
                    <h3>BPM {{ songData.bpm }}</h3>
                  </v-row>
                  <v-row>
                    <v-slider max="300" min="1" v-model="songData.bpm">
                    </v-slider
                  ></v-row>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-textarea
                    clearable
                    label="Describtion"
                    v-model="songData.describtion"
                    prepend-icon="mdi-text-box-outline"
                  ></v-textarea
                ></v-col>
                <v-col>
                  <h3>Website</h3>
                  <v-text-field
                    v-model="songData.externalUrl"
                    label="Website"
                    single-line
                  ></v-text-field
                ></v-col>
              </v-row>
            </v-form>
            <v-row justify="space-between" class="pa-3">
              <v-row>
                <v-col align-self="start" xs="6" sm="5" md="4" lg="3" xl="2">
                  <v-btn text @click="e1 = 1">Back</v-btn>
                </v-col></v-row
              >

              <v-col
                align-self="end"
                class="text-right"
                xs="6"
                sm="5"
                md="4"
                lg="3"
                xl="2"
              >
                <v-row>
                  <v-btn
                    v-if="!metaReady"
                    color="pink"
                    @click="createMeta(song, songData)"
                    >Check and Create Metadata
                  </v-btn></v-row
                >

                <v-row justify="space-between">
                  <v-btn
                    v-if="metaReady"
                    color="blue"
                    @click="createMeta(song, songData)"
                    >Update Meta</v-btn
                  >
                  <v-btn v-if="metaReady" @click="e1 = 3" color="green"
                    >Go on!</v-btn
                  ></v-row
                >
              </v-col>
            </v-row>
          </v-container>
        </v-stepper-content>
        <v-stepper-content step="3">
          <v-container v-if="!loading">
            <v-row justify="center" align="center" v-if="!nftReady"
              ><v-col cols="6">
                <h2>The final step</h2>
                <br />
                <h4 class="grey--text">How many NFTs do you want (max. 5)</h4>
                <v-text-field
                  v-model="quantity"
                  label="Website"
                  single-line
                ></v-text-field>
                <h1>Lets mint!</h1>
                <br />
                <v-btn @click="createNFT(song, quantity)" color="pink"
                  >Mint</v-btn
                >
                <br />
                <br />
              </v-col>
            </v-row>
            <v-row justify="center" align="center" v-if="nftReady"
              ><v-col cols="6"
                ><h1 class="green--text">
                  Success! Your NFT minted successfully :)
                </h1></v-col
              ></v-row
            >
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
          <v-row justify="space-between" class="pa-3">
            <v-col align-self="start" xs="6" sm="5" md="4" lg="3" xl="2">
              <v-btn text @click="e1 = 2">Back</v-btn>
            </v-col>
            <v-col
              align-self="end"
              class="text-right"
              xs="6"
              sm="5"
              md="4"
              lg="3"
              xl="2"
            >
            </v-col>
          </v-row>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import useMoralis from "@/services/useMoralis.js";
import { watch } from "~/composition";
export default {
  data() {
    return {
      e1: 1,
      confirm: false,
      overlay: true,
      quantity: 1,
      songData: {
        bpm: 1,
        duration: 1,
        name: "Test",
        describtion: "test",
        externalUrl: ".com",
      },
    };
  },
  methods: {
    ...mapGetters(["GET_song"]),
    ...mapActions(["updateSong"]),
  },
  computed: {
    song: {
      get() {
        return this.GET_song();
      },
    },
  },
  mounted() {
    const song = this.GET_song();
    this.songData.name = song?.attributes?.name;
    this.songData.bpm = song?.attributes?.bpm;
    this.songData.duration = song?.attributes?.duration;
    this.songData.describtion = song?.attributes?.describtion;
    this.songData.externalUrl = song?.attributes?.externalUrl;
    if (song.attributes.ipfsUrl) {
      this.e1 = 2;
    }
    if (song.attributes.metaUrl) {
      (this.confirm = true), (this.overlay = false);
    }
  },
  setup() {
    const {
      mixSong,
      user,
      createMeta,
      loading,
      createNFT,
      metaReady,
      nftReady,
    } = useMoralis();
    metaReady.value = false;
    return {
      mixSong,
      user,
      createMeta,
      loading,
      createNFT,
      metaReady,
      nftReady,
    };
  },
};
</script>

<style lang="scss" scoped>
</style>