import Vue from "vue";
// import Vuex from 'vuex'
import Vuex from "../my-vuex/index.js";
import { createLogger } from "vuex";

Vue.use(Vuex);
/* 
	实现一个Logger插件
 */
const LoggerPlugin = (store) => {
  // 克隆一份store.state 当做快照
  let prevState = JSON.parse(JSON.stringify(store.state));

  store.subscribe((mutation, state) => {
    const { type, payload } = mutation;
    let nextState = JSON.parse(JSON.stringify(state));
    console.log("prevState", type, prevState,"nextState", type, nextState);
    prevState = nextState;
  });
};

/* 
	实现一个数据持久化的插件
	避免每次提交mutation的时候都写一行storage.setItem 
 */
const persitsPlugin = (store) => {
  // 尝试取出全局状态
  let persitsState = localStorage.getItem && localStorage.getItem("VUEX");

  // 刷新store 确保持久话
  if (persitsState) {
    store.replaceState(JSON.parse(persitsState));
  }

  // 每次提交mutation引起state变化就把state存入全局状态
  store.subscribe((mutation, state) => {
    localStorage.setItem("VUEX", JSON.stringify(state));
  });
};

const store = new Vuex.Store({
	strict:true,
  plugins: [
	persitsPlugin, 
	// createLogger(), 
	LoggerPlugin],
  state: {
    age: 100,
    // moduleA:{
    // age:50
    // }
  },
  getters: {
    newAge(state) {
      return state.age + "---";
    },
  },
  mutations: {
    add(state, payload) {
      state.age += payload;
    },
  },
  actions: {
    add(store, payload) {
      let { commit } = store;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          commit("add", payload);
          // 修改完成之后再去修改promsie的状态 让外界也就是业务组件内部可以获取到修改的结果
          resolve();
        }, 500);
      });
    },
	sub(store, payload) {
		let { commit } = store;
		return new Promise((resolve, reject) => {
		  setTimeout(() => {
			commit("sub", payload);
			// 修改完成之后再去修改promsie的状态 让外界也就是业务组件内部可以获取到修改的结果
			resolve();
		  }, 500);
		});
	  }
  },
  modules: {
    moduleA: {
      namespaced: true,
      state: {
        age: 200,
      },
      getters: {
        newAge(state) {
          return state.age + "---";
        },
      },
      mutations: {
        add(state, payload) {
          state.age = state.age + payload + 10;
        },
      },
	  actions:{
		add(store, payload) {
			let { commit } = store;
			setTimeout(() => {
				commit("add", payload);
				// 修改完成之后再去修改promsie的状态 让外界也就是业务组件内部可以获取到修改的结果

			  }, 500);
		  },
	  },
      modules: {
        moduleC: {
          namespaced: true,
          state: {
            age: 400,
          },
          mutations: {
            add(state, payload) {
              state.age = state.age + payload + 50;
            },
          },
        },
      },
    },
    moduleB: {
      namespaced: true,
      state: {
        age: 300,
      },
      mutations: {
        add(state, payload) {
          state.age = state.age + payload + 20;
        },
      },
    },
  },
});

/* 动态注册新模块registerModule */
store.registerModule(["moduleB", "moduleX"], {
  namespaced: true,
  state: {
    age: 500,
  },
  getters: {
    newAge(state) {
      return state.age + "xxx";
    },
  },
  mutations: {
    add(state, payload) {
      state.age = state.age + payload + 500;
    },
  },
});

export default store;
