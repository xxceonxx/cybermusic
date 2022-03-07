import Moralis from "@/services/moralis";
import { ref, watchEffect } from "@/composition";

const hasAuthError = ref(false);
const authError = ref(false);
const user = ref(null);
const isAuthenticated = ref(false);
const isAuthenticating = ref(false);
const songs = ref([]);
const tracks = ref([]);
const loading = ref(false);

watchEffect(() =>
  authError.value ? (hasAuthError.value = true) : (hasAuthError.value = true)
);

const currentUser = Moralis.User.current();

if (currentUser) {
  user.value = currentUser;
  isAuthenticated.value = true;
}

export default function useMoralis() {
  const authenticate = async (options = {}) => {
    try {
      user.value = await Moralis.authenticate(options);
      web3.value = await Moralis.enableWeb3(
        options.provider ? { provider: "walletconnect" } : {}
      );
      const currentUser = Moralis.User.current();

      console.log(currentUser.get("ethAddress"));
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
    const file = new Moralis.File("test.png", input);
    const ipfs = await file.saveIPFS();
    return ipfs;
  };

  const findSong = async (songId) => {
    console.log("the id:", songId);
    const query = new Moralis.Query("Song");
    const song = query.equalTo("objectId", songId);
    query.include("tracks");
    const result = await song.find();
    return result[0];
  };

  const findTrack = async (trackId) => {
    console.log("the id:", trackId);
    const query = new Moralis.Query("Track");
    const track = query.equalTo("objectId", trackId);
    const result = await track.find();
    console.log(result, "the tracks")
    return result[0];
  };

  const createTrack = async (instrument, file, songId) => {
    //set loading to true
    loading.value = true;
    //upload ipfs File
    const ipfs = await ipfsUpload(file);
    console.log(ipfs);
    //create new Track
    const Track = Moralis.Object.extend("Track");
    const track = new Track();
    //set Trackdata
    track.set("ipfsUrl", ipfs.ipfs());
    track.set("ipfsHash", ipfs.hash());
    track.set("instrument", instrument);
    track.set("creator", currentUser.get("ethAddress"));
    const createdTrack = await track.save();
    //Add Track to Song (relation)
    const song = await findSong(songId);
    const relation = song.relation("tracks");
    relation.add(track);
    song.save();
    //reload Tracks
    getTracks(songId);
    //set loading to false
    loading.value = true;
    return track;
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
    song.set("creator", currentUser.get("ethAddress"));

    const result = await song.save().then(
      (newSong) => {
        currentUser.addUnique("songs", newSong.id);
        currentUser.save();
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
    query.containedIn("objectId", currentUser.get("songs"));
    query.include(["tracks"]);
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
    console.log(getTracks[0].id, "fafa");
    tracks.value = getTracks;
    //set loading to false
    loading.value = false;
  };

  const updateInstrumentName = async (instrument, trackId) => {
    //set loading to true
    loading.value = true;
    const track = await findTrack(trackId);
    track.set("instrument", instrument);
    await track.save();
    getTracks();
  };

  const uploadTrack = async (instrument, toUpload, songId) => {
    const upload = new Moralis.File("test.png", toUpload);
    await upload.saveIPFS().then(
      (res) => {
        /* Steps
        Search for song
        search for track
        search for instrument
        upload track at instrument (ipload ipfs adress) */
        const ipfsUrl = res.ipfs();
        const ipfsHash = res.hash();
        const Song = Moralis.Object.extend("Song");
        const query = new Moralis.Query(Song);
        query.get(songId).then((song) => {
          instrument = song.tracks.findIndex(
            (element) => element.instrument === instrument
          );
          (song.tracks[instrument].ipfsUrl = ipfsUrl),
            (song.tracks[instrument].ipfsUrl = ipfsHash),
            song.set("tracks", song.tracks);
          song.save();
        });
      },
      (error) => {
        alert("Failed to create new object, with error code: " + error.message);
      }
    );
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
  };
}
