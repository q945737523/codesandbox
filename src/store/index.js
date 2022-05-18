import Vue from 'vue'
import Vuex from 'vuex'


Vue.use(Vuex)

const state = {
  nodes: []
}

const mutations = {
  setNodes (state, value) {
    state.nodes = value
  }
}

const actions = {
  callNodes ({ commit }, value) {
    commit('setNodes', value)
  }
}

export default new Vuex.Store({
  state,
  mutations,
  actions
})
