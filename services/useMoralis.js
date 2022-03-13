import Moralis from "@/services/moralis";
import { ref, watchEffect } from "@/composition";
import { MultiStreamRecorder } from "msr";
/* import { MediaStreamRecorder } from "msr"; */

var MediaStreamRecorder = require("msr");

const hasAuthError = ref(false);
const authError = ref(false);
const user = ref(null);
const isAuthenticated = ref(false);
const isAuthenticating = ref(false);
const songs = ref([]);
const tracks = ref([]);
const loading = ref(false);
const images = [
  "https://gateway.pinata.cloud/ipfs/QmTSwYWnnB9LW4bCKqyaAg7vrYhdoLLevzAchQaGg3PPzt",
  "https://gateway.pinata.cloud/ipfs/QmTSmz3MWt2F5Kcz4vktxoepLqRg6kwikvb2fus9wWRE6S",
  "https://gateway.pinata.cloud/ipfs/QmXPCTmUoTPUbW1hN5KFNv8pehjUAVxTZ5TQEHLtHCcTUL",
  "https://gateway.pinata.cloud/ipfs/QmX46PtZorWJrzCk34WSitPW4XK6a1S2Gc6BDDgkj115ok",
  "https://gateway.pinata.cloud/ipfs/QmVXcnCyKQ3vSqgsExfuJcuKwSADZ9s66MxjuvRzSLehYG",
  "https://gateway.pinata.cloud/ipfs/QmUS5ukGNj4kbYH6hnfu6Eg6Q9d6GgsEP2gfkjVCQT856p",
  "https://gateway.pinata.cloud/ipfs/QmNfGsPqVaiKfKZNbY48Epdafp4GERJZHgFkazDE9bNPZG",
];
const metaReady = ref(false);
const nftReady = ref(false);
const access = ref(false);

const AUTH = process.env.VUE_APP_NFTPORT_API_KEY;
const CONTRACT_ADDRESS = process.env.VUE_APP_NFTPORT_CONTRACT_ADDRESS;
const CHAIN = "rinkeby";
const quantity = "1";
const currentTrack = ref();

watchEffect(() =>
  authError.value ? (hasAuthError.value = true) : (hasAuthError.value = true)
);

const currentUser = Moralis.User.current();

if (currentUser) {
  user.value = currentUser;
  isAuthenticated.value = true;
}

export default function useMoralis() {
  const isOwner = async (song) => {
    var songOwner = song.attributes.creator.id;
    if (user.value.id === songOwner) {
      console.log("is owner true");
      console.log(user.value.id);
      console.log(songOwner);
      access.value = true;
      return true;
    } else {
      console.log("is owner false");
      console.log(user.value.id);
      console.log(songOwner);
      access.value = false;
      return false;
    }
  };

  const createMeta = async (song, songData) => {
    //set loading true
    loading.value = true;

    console.log(song, "song");
    const tracks = await getTracks(song.id);
    console.log("tacks", tracks);
    console.log("date", new Date());
    console.log("user", currentUser.get("ethAddress"));
    // create metaData Object
    var metaData = {
      name: songData.name,
      description: songData.describtion,
      duration: song.attributes.duration,
      bpm: song.attributes.bpm,
      image: song.attributes.image,
      song: song.attributes.ifpsUrl,
      hash: song.attributes.ifpsHash,
      date: new Date(),
      externalUrl: songData.externalUrl,
      creator: song.attributes.creator.attributes.ethAddress,
      tracks: [],
      attributes: {
        duration: song.attributes.duration,
        bpm: song.attributes.bpm,
      },
    };

    console.log(tracks[0], "value");
    //add track artists
    for (let key in tracks) {
      metaData.tracks.push({
        creator: tracks[key].attributes.creator.attributes.ethAddress,
        instrument: tracks[key].attributes.instrument,
        track: tracks[key].attributes.ipfsUrl,
        hash: tracks[key].attributes.ipfsHash,
      });
    }

    console.log("METADATA", metaData);

    //todo:
    //set meta in song

    const file = new Moralis.File("file.json", {
      base64: btoa(JSON.stringify(metaData)),
    });

    const ipfs = await file.saveIPFS();
    console.log(ipfs.ipfs());

    song.set("metaUrl", ipfs.ipfs());
    song.set("metaHash", ipfs.hash());
    song.set("status", "meta");
    song.set("name", songData.name);
    song.set("describtion", songData.describtion);
    song.set("externalUrl", songData.externalUrl);
    song.save();

    metaReady.value = true;

    //set loading false
    loading.value = false;
  };

  const mixSong = async (song) => {
    //set loading true
    loading.value = true;

    const streamArray = [];
    console.log("start mix Song");
    console.log("tracks", tracks);
    for (let track in tracks.value) {
      //prepare tracks
      const audio = new Audio(tracks.value[track].attributes.ipfsUrl);
      audio.volume = 1;
      audio.loop = false;
      audio.crossOrigin = "anonymous";
      await audio.play();

      //prepare audtiostream
      const stream = audio.captureStream
        ? audio.captureStream()
        : audio.mozCaptureStream
        ? audio.mozCaptureStream()
        : null;

      //push stream to array
      streamArray.push(stream);
      console.log("Array", streamArray);
    }

    //combine all tracks in one Stream
    const ctx = new AudioContext();
    console.log(ctx, "ctx");
    const dest = ctx.createMediaStreamDestination();
    console.log(dest, "dest");
    // Connect streams to the destination audio stream.
    streamArray.map((stream) => {
      ctx.createMediaStreamSource(stream).connect(dest);
    });

    const mixedTracks = dest.stream.getTracks()[0];

    // Combine video and audio tracks into single stream.
    const stream = new MediaStream([mixedTracks]);

    function recordAudio() {
      console.log("start recording");
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start();
      console.log("start", song.attributes.duration);
      var recordedChunks = [];
      // demo: to download after 9sec
      setTimeout((event) => {
        console.log("stopping");
        mediaRecorder.stop();
      }, song.attributes.duration * 1000);

      function handleDataAvailable(event) {
        console.log("data-available");
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log(recordedChunks);
          upload();
        } else {
          // define an error
        }
      }
      const upload = async () => {
        var blob = new Blob(recordedChunks, {
          mimeType: "audio/webm",
        });
        //upload to ipfs
        const ipfs = await ipfsUpload(blob);
        console.log(ipfs.ipfs());
        console.log(song, "input");

        song.set("ipfsUrl", ipfs.ipfs());
        song.set("ipfsHash", ipfs.hash());
        song.set("status", "uploaded");
        song.save();

        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "test.mp3";
        a.click();
        window.URL.revokeObjectURL(url);
        //set loading false
        loading.value = false;
      };
    }
    recordAudio();
  };

  const createNFT = async (song, quantity) => {
    //set loading true
    loading.value = true;
    if (quantity > 5) {
      return console.log("error - quantity over 5");
    } else {
      const query = new Moralis.Query("TokenId");
      const songToken = query.equalTo("name", "songToken");
      const token = await songToken.find();
      console.log(token);

      let url = "https://api.nftport.xyz/v0/mints/customizable/batch";
      const mintInfo = {
        chain: CHAIN,
        contract_address: CONTRACT_ADDRESS,
        tokens: [
          {
            mint_to_address: currentUser.get("ethAddress"),
            token_id: token[0].attributes.tokenId,
            metadata_uri: song.attributes.metaUrl,
            quantity: quantity,
          },
        ],
      };

      console.log(mintInfo);

      let options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH,
        },
        body: JSON.stringify(mintInfo),
      };

      return fetch(url, options).then(async (res) => {
        const status = res.status;

        if (status === 200) {
          console.log(res.json());
          song.set("status", "minted");
          song.save();
          const nextId = token[0].attributes.tokenId + 1;
          token[0].set("tokenId", nextId);
          token[0].save();
          //set loading false
          loading.value = false;
          nftReady.value = true;
          return res;
        } else {
          //set loading false
          loading.value = false;
          console.error(`ERROR STATUS: ${status}`);
        }
      });
    }
  };

  const authenticate = async (options = {}) => {
    try {
      user.value = await Moralis.authenticate(options);
      web3.value = await Moralis.enableWeb3(
        options.provider ? { provider: "walletconnect" } : {}
      );
      const currentUser = Moralis.User.current();

      console.log(currentUser.get("objectId"));
      console.log(currentUser);
      isAuthenticating.value = false;
      isAuthenticated.value = true;
    } catch (error) {
      authError.value = error;
      isAuthenticating.value = false;
    }
  };

  const signin = async (username, password) => {
    try {
      isAuthenticating.value = true;
      user.value = await Moralis.User.logIn(username, password, {
        usePost: true,
      });
      isAuthenticating.value = false;
    } catch (error) {
      authError.value = error;
    }
  };

  const signup = async (email, password) => {
    const user = new Moralis.User();
    user.set("username", email);
    user.set("email", email);
    user.set("password", password);
    try {
      await user.signUp();
    } catch (error) {
      authError.value = error;
    }
  };

  const logout = async () => {
    isAuthenticating.value = true;
    isAuthenticated.value = false;
    user.value = null;
    isAuthenticating.value = false;
    Moralis.User.logOut();
  };

  const ipfsUpload = async (input) => {
    const file = new Moralis.File("track.mp3", input);
    const ipfs = await file.saveIPFS();
    return ipfs;
  };

  const findSong = async (songId) => {
    const query = new Moralis.Query("Song");
    const song = query.equalTo("objectId", songId);
    query.include("tracks");
    const result = await song.find();
    return result[0];
  };

  const findTrack = async (trackId) => {
    const query = new Moralis.Query("Track");
    const track = query.equalTo("objectId", trackId);
    const result = await track.find();
    console.log(result, "the tracks from findTracks");
    return result[0];
  };

  const createSong = async (name, duration, bpm) => {
    //set loading to true
    loading.value = true;
    //create new Song
    const Song = Moralis.Object.extend("Song");
    const song = new Song();
    //set Songdata
    song.set("name", name);
    song.set("duration", duration);
    song.set("bpm", bpm);
    song.set("creator", currentUser);
    song.set("status", "open");
    song.set("image", images[Math.floor(Math.random() * images.length)]);
    const result = await song.save().then(
      (newSong) => {
        currentUser.addUnique("songs", newSong.id);
        currentUser.save();
        return true;
      },
      (error) => {
        alert("Failed to create new object, with error code: " + error.message);
      }
    );
    getSongs();
    //set loading to false
    loading.value = false;
    return result;
  };

  const getSongs = async () => {
    //set loading to true
    loading.value = true;
    const query = new Moralis.Query("Song");
    const currentUser = Moralis.User.current();
    query.include("tracks");
    query.containedIn("objectId", currentUser.get("songs"));
    await query.find().then((res) => {
      songs.value = res;
      //set loading to false
      loading.value = false;
    });
  };

  const getTracks = async (songId) => {
    //set loading to true
    loading.value = true;
    const song = await findSong(songId);
    const relation = song.relation("tracks");
    const getTracks = await relation.query().find();
    console.log(getTracks[0], "fafa");
    tracks.value = getTracks;
    //set loading to false
    loading.value = false;
    return getTracks;
  };

  const updateInstrumentName = async (instrument, trackId, songId) => {
    //set loading to true
    loading.value = true;
    const track = await findTrack(trackId);
    track.set("instrument", instrument);
    await track.save();
    await getTracks(songId);
    //loading is set to false in getTracks()
  };

  const createTrack = async (instrument, file, songId) => {
    //set loading to true
    loading.value = true;

    if (file) {
      //upload ipfs File
      const ipfs = await ipfsUpload(file);
      console.log(ipfs);
      //create new Track
      const Track = Moralis.Object.extend("Track");
      const track = new Track();
      const song = await findSong(songId);
      //set Trackdata
      track.set("ipfsUrl", ipfs.ipfs());
      track.set("ipfsHash", ipfs.hash());
      track.set("instrument", instrument);
      track.set("creator", currentUser);
      track.set("song", song);
      track.set("status", "open");
      await track.save();
      //Add Track to Song (relation)
      const relationToTrack = song.relation("tracks");
      relationToTrack.add(track);
      song.save();
      //set Track to User
      const relationToUser = currentUser.relation("tracks");
      relationToUser.add(track);
      currentUser.save();
      //reload Tracks
      tracks.value.push(track);
      //set loading to false
      loading.value = false;
      return track;
    } else {
      //create new Track
      const Track = Moralis.Object.extend("Track");
      const track = new Track();
      const song = await findSong(songId);
      //set Trackdata
      track.set("instrument", instrument);
      track.set("creator", currentUser);
      track.set("song", song);
      track.set("status", "open");
      await track.save();
      //Add Track to Song (relation)
      const relationToTrack = song.relation("tracks");
      relationToTrack.add(track);
      song.save();
      //set Track to User
      const relationToUser = currentUser.relation("tracks");
      relationToUser.add(track);
      currentUser.save();
      //reload Tracks
      tracks.value.push(track);
      //set loading to false
      loading.value = false;
      return track;
    }
  };

  const uploadTrack = async (file, trackId, songId) => {
    //set loading to true
    loading.value = true;

    new Moralis.File("track.mp3", file);

    const ipfs = await ipfsUpload(file);
    //get ipfs response
    const ipfsUrl = ipfs.ipfs();
    const ipfsHash = ipfs.hash();
    //find track and update ipfs and status
    const track = await findTrack(trackId);
    track.set("ipfsUrl", ipfsUrl);
    track.set("ipfsHash", ipfsHash);
    track.set("status", "uploaded");
    track.save();

    currentTrack.value = track
    //load tracks again
    getTracks(songId);
    //set loading to false
    loading.value = false;
  };

  const deleteTrack = async (trackId, songId) => {
    //set loading to true
    loading.value = true;
    const track = await findTrack(trackId);
    await track.destroy();
    getTracks(songId);
    //set loading to false
    loading.value = false;
  };

  const deleteSong = async (songId) => {
    //set loading to true
    loading.value = true;
    const song = await findSong(songId);
    await song.destroy();
    getSongs(songId);
    //set loading to false
    loading.value = false;
  };

  const startGame = async (instruments) => {
    console.log("choosen instruments", instruments);
    //find one track with isntruments ["guitar", "drums", "keys"]
    //get randome instrument from instruments
    const instrument =
      instruments[Math.floor(Math.random() * instruments.length)];
    //create query for Tracks
    const queryTrack = new Moralis.Query("Track");
    queryTrack.equalTo("instrument", instrument);
    console.log("objectId", currentUser);
    queryTrack.notEqualTo("noEditor", currentUser);
    queryTrack.equalTo("status", "open");
    queryTrack.first();
    const track = await queryTrack.find();
    const querySong = new Moralis.Query("Song");
    querySong.equalTo("status", "open");
    querySong.matchesQuery("tracks", queryTrack);
    querySong.include(["tracks.attributes.instrument"]);
    const result = await querySong.find();

    if (track[0]) {
      //set track editor
      track[0].set("editor", currentUser);
      track[0].set("status", "editing");
      track[0].save();
      //set realtion to user
      const relationToUser = currentUser.relation("tracks");
      relationToUser.add(track[0]);
      currentUser.save();

      console.log(result, "specific song");
      console.log(track, "specific track");
      currentTrack.value = track[0];
    }

    return { song: result[0], instrument: instrument };
  };

  return {
    authenticate,
    signin,
    signup,
    logout,
    isAuthenticated,
    isAuthenticating,
    user,
    authError,
    hasAuthError,
    createTrack,
    createSong,
    getSongs,
    getTracks,
    songs,
    tracks,
    uploadTrack,
    findSong,
    updateInstrumentName,
    loading,
    deleteTrack,
    startGame,
    deleteSong,
    mixSong,
    createMeta,
    createNFT,
    metaReady,
    nftReady,
    isOwner,
    access,
    currentTrack,
  };
}
