export const state = () => ({
  song: {},
  lockedInstruments: [],
  instrument: null,
});

export const getters = {
  GET_song: (state) => {
    return state.song;
  },
  GET_lockedInstruments: (state) => {
    return state.lockedInstruments;
  },
  GET_instrument: (state) => {
    return state.instrument;
  },
};

export const mutations = {
  SET_song(state, payload) {
    state.song = payload;
  },
  SET_lockedInstruments(state, payload) {
    state.lockedInstruments = payload;
  },
  Add_lockedInstrument(state, payload) {
    state.lockedInstruments.push(payload);
  },
  Delete_lockedInstrument(state, payload) {
    var index = state.lockedInstruments.indexOf(payload);
    state.lockedInstruments.splice(index, 1);
  },
  SET_instrument(state, payload) {
    state.instrument = payload;
  },
};

export const actions = {
  updateLockedInstruments: ({ commit }, payload) => {
    commit("SET_lockedInstruments", payload);
  },
  updateSong: ({ commit }, payload) => {
    commit("SET_song", payload);
  },
};
