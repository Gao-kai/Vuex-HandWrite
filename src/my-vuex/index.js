import install from "./install.js";
import ModuleCollection from "./module/moduleCollection.js";
import { Vue } from "./install.js";

class Store {
  constructor(options) {
    /* 模块收集实现 */
    this._modules = new ModuleCollection(options);
    console.log("this._modules", this._modules);

    /* 模块的安装实现 */
    this._mutation = Object.create(null);
    this._actions = Object.create(null);
    this._wrapperGetters = Object.create(null);

    /* 插件机制 */
    this.plugins = options.plugins || [];
    this.subscribes = [];

    /* 严格模式 */
    this.strict = options.strict;
    this.commiting = false;

    // 获取根状态 并传入到installModule 这个过程会将所有模块的状态定义到根模块对象上来
    const state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    console.log("安装完成的根实例state", state);

    // 创建实例 将计算属性和state声明到我们的实例上来
    resetStoreVm(this, state);

    // 初始化时执行注册的插件
    this.plugins.forEach((plugin) => {
      plugin(this);
    });
  }

  // 包裹mutation的方法 保证commiting在执行fn的时候一定为true
  _withCommiting(mutationFn) {
    this.commiting = true;
    mutationFn();
    this.commiting = false;
  }

  // 获取state
  get state() {
    return this._vm._data.$$state;
  }

  // 和React中类组件的函数定义一样 保证this永远指向store实例
  commit = (type, payload) => {
    // this._mutation：{add:[f1,f2,f3...]}

    this._mutation[type] &&
      this._mutation[type].forEach((fn) => {
        fn.call(this, payload);
      });
  };

  dispatch = (type, payload) => {
    // this.actions：{add:[f1,f2,f3...]}

    let actionResults = this._actions[type].map((action) => {
      // 每一个action执行之后可能是一个Promsie实例 也可能是一个基本值 actionResults = [p1,p2,undefined...]
      return action.call(this, payload);
    });
    console.log("actionResults", actionResults);

    // dispatch调用之后会返回一个新的promise给组件处 外界可以通过.then的方式得知Vuex中是否已经完成了state的更新以及获取到最新的state值
    return Promise.all(actionResults);
  };

  /* 
		动态注册模块
		path可以是一个字符串 比如：'a/c' 代表在a模块下注册一个c模块
		path也可以是一个数组 比如['a','c'] 同上
		
		module就是要注册的用户传入的module配置对象
		{
			namespace：true，
			state：{}，
			mutations：{},
			...
		}
	 */
  registerModule(path, module) {
    // 首先进行新模块的模块收集 也就是将传入的对象确定父子关系并进行格式化
    this._modules.register(path, module);

    // 安装新模块 这一步就会在store对象上将新模块的各项配置添加到_mutation、_actions等
    installModule(this, this.state, path, module.newModule);

    // 将动态模块的计算属性变为响应式的 这里采用暴力方法 直接重新走一遍实例响应式收集的过程
    resetStoreVm(this, this.state);
  }

  /* 收集插件订阅函数 */
  subscribe(callback) {
    this.subscribes.push(callback);
  }

  /* 
		更新状态
		需要注意这里替换了之后
		后续所有mutation\getter执行去获取的还是以前的rootModule.state
		也就是初始化传入的那个state
		 
		{
			a:{age:10},
			b:{age:20}
		}
		此时假设触发一个模块a的mutation 取得就是a模块的{age：10}
		
		
		replaceState之后将旧的state进行了替换：
		{
			a:{age:12},
			b:{age:22}
		}
		此时假设触发一个模块a的mutation 模块的state没有变化 还是{age:10},
		变化的是大的state对象 所以需要动态的去刷新一下自己模块的值
		就用getState方法 将自己的模块名称路径传进去
		这样子才可以保证获取到的是最新的值
		
		
	 */
  replaceState(state) {
	this._withCommiting(() => {
		this._vm._data.$$state = state;
	});
  }
}

function getState(store, moduleNames) {
  // 先获取到初始状态
  let initState = store.state;
  // 递归去获取到当前mutation触发时的那个模块的最新状态
  return moduleNames.reduce((start, moduleName) => {
    return start[moduleName];
  }, initState);
}

function forEachValue(obj, callback) {
  Object.keys(obj).forEach((key) => {
    callback(key, obj[key]);
  });
}

/* 
	重置实例
	此过程会将state以及getters都变成响应式的数据
 */
function resetStoreVm(store, state) {
  let oldVm = store._vm;
  // 获取到所有模块的getters
  const wrapperGetters = store._wrapperGetters;
  const storeComputed = {};
  store.getters = {};
  forEachValue(wrapperGetters, (getterKey, getterValue) => {
    /*
			这里的目的是将用户传入的getters中的方法借助vue原生的计算属性
			实现缓存 也就是页面多次取值 只触发一次getter
		 */
    storeComputed[getterKey] = getterValue;

    /*
			这里的目的是当我们在页面中通过$store.getters.[getterKey]取值的时候 
			代理到去this._vm[getterKey]上取值
		 */

    Object.defineProperty(store.getters, getterKey, {
      get: () => {
        return store._vm[getterKey];
      },
    });
  });

  // store上产生新的实例 很暴力的方法 直接new一个新的实例 实例上的data和计算属性一定是响应式的
  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed: storeComputed,
  });

  // 在严格模式下监听state的值的变化 如果commiting为false 那么抛出异常
  if (store.strict) {
    /* 
		基于watch实现 同步并且深度监听 默认为异步监听
		第一个参数是函数或者表达式：()=>store._vm._data.$$state,
		第二个参数是回调
		第三个参数是options 里面可以声明同步和深度监听
	*/
    store._vm.$watch(
      ()=>store._vm._data.$$state,
      () => {
        console.assert(
          store.commiting,
          "不能在严格模式下通过mutation之外的函数修改state"
        );
      },
      { sync: true, deep: true }
    );
  }

  // 清除旧的实例
  if (oldVm) {
    Vue.nextTick(() => oldVm.$destory);
  }
}

function installModule(store, rootState, moduleNames, rootModule) {
  // 只有是子模块的时候才需要将子模块的状态定义在根上面 ['moduleA','moduleC']
  if (moduleNames.length > 0) {
    let childModuleName = moduleNames[moduleNames.length - 1];
    let parentModuleNames = moduleNames.slice(0, -1);
    let parentState = rootState;
    for (var i = 0; i < parentModuleNames.length; i++) {
      let parentModuleName = parentModuleNames[i];
      parentState = parentState[parentModuleName];
    }
    // {age:100,moduleA:{age:200,moduleC:{age:300}}}

    // 为了避免动态添加的模块的state无法响应式更新 这里要用set方法
	store._withCommiting(() => {
		Vue.set(parentState, childModuleName, rootModule.state);
	  });
   
    // parentState[childModuleName] = rootModule.state;
  }

  /* 
			需要按照moduleNames [a,c,d]添加模块命名空间前缀
			本质就是字符串拼接
		 */

  let namespaced = store._modules.getNameSpace(moduleNames);
  // console.log('namespaced',namespaced);

  /* 
			给store上安装mutations
			取出用户传入的mutations 然后分别定义
			如果有值 那么push
			如果没有值 那么放入一个空数组中进行赋值
		 */
  rootModule.forEachMutation((mutationKey, mutationValue) => {
    if (store._mutation[namespaced + mutationKey]) {
      store._mutation[namespaced + mutationKey].push((payload) => {
        // 这里保证每一次mutation中函数执行的时候 全局store上的commiting的值为true
        store._withCommiting(() => {
          // 这里需要去动态获取最新的state
          mutationValue(getState(store, moduleNames), payload);
        });

        // 每次mutationValue执行之后执行注册插件时订阅的方法
        store.subscribes.forEach((cb) => {
          cb({ type: mutationKey, payload }, store.state);
        });
      });
    } else {
      store._mutation[namespaced + mutationKey] = [
        (payload) => {
          // 这里保证每一次mutation中函数执行的时候 全局store上的commiting的值为true
          store._withCommiting(() => {
            mutationValue(getState(store, moduleNames), payload);
          });
          // 每次mutationValue执行之后执行注册插件时订阅的方法
          store.subscribes.forEach((cb) => {
            cb({ type: mutationKey, payload }, store.state);
          });
        },
      ];
    }
  });

  /*
			给store上安装actions
			取出用户传入的actions 然后分别定义
		 */
  rootModule.forEachActions((actionKey, actionValue) => {
    if (store._actions[namespaced + actionKey]) {
      store._actions[namespaced + actionKey].push((payload) => {
        // action方法执行之后可能返回一个promise 也有可能是一个undefined或者js中的值
        let res = actionValue(store, payload);
        return res;
      });
    } else {
      store._actions[namespaced + actionKey] = [
        (payload) => {
          // action方法执行之后可能返回一个promise 也有可能是一个undefined或者js中的值
          let res = actionValue(store, payload);
          return res;
        },
      ];
    }
  });

  /*
			给store上安装getters
		 */
  rootModule.forEachGetters((getterKey, getterValue) => {
    if (store._wrapperGetters[namespaced + getterKey]) {
      console.error(`[my-vuex] duplicate getter key: ${getterKey}`);
    }
    store._wrapperGetters[namespaced + getterKey] = () => {
      return getterValue(getState(store, moduleNames));
    };
  });

  /*
			给store上安装modules 递归
		 */
  rootModule.forEachModules((moduleName, module) => {
    installModule(store, rootState, moduleNames.concat(moduleName), module);
  });

  // console.log('store',store);
}

export default {
  Store,
  install,
};
