export let Vue;

function install(_Vue){
	Vue = _Vue;
	// 所有组件在加载时在实例上注入$store变量
	Vue.mixin({
		beforeCreate(){
			// 这里的this是组件实例或者根实例
			if(this.$options.store){
				this.$store = this.$options.store;
			}else if(this.$parent && this.$parent.$store){
				this.$store = this.$parent.$store;
			}
		}
	})
}

class Store {
	constructor(options){
		let state = options.state;
		let getters = options.getters;
		let mutations = options.mutations;
		let actions = options.actions;
		
		// 这里的this就是任意一个组件中都有的那个全局$store状态对象
		// 希望这里的state和getters是响应式的 只要状态变化就更新视图
		// 将state利用Vue中data的数据是响应式的联系起来
		
		
		
		/* 代理计算属性getters */
		this.getters = {};
		const storeComputed = {};
		
		Object.keys(getters).forEach((getterKey)=>{
			/* 
				这里的目的是将用户传入的getters中的方法借助vue原生的计算属性
				实现缓存 也就是页面多次取值 只触发一次getter
			 */
			storeComputed[getterKey] = ()=>{
				return getters[getterKey](this.state);
			};
			
			/* 
				这里的目的是当我们在页面中通过$store.getters.[getterKey]取值的时候 
				代理到去this._vm[getterKey]上取值
			 */
			Object.defineProperty(this.getters,getterKey,{
				get:()=>{
					return this._vm[getterKey];
				}
			})
		})
		
		
		this._vm = new Vue({
			data:{
				// 可以直接在this.vm.$$state上获取 因为进行了代理
				$$state:state,
				// data中的属性带$或_ 不可以直接获取需要通过this._vm._data.$state上获取
			},
			computed:storeComputed
		})
		
		this.mutations = mutations;
		this.actions = actions;
		
	}
	
	// 访问this.$store.state的时候会触发的属性访问器
	get state(){
		return this._vm._data.$$state;
	}
	
	// 和React中类组件的函数定义一样 保证this永远指向store实例
	commit = (type,payload) =>{
		this.mutations[type](this.state,payload);
	}
	
	dispatch = (type,payload)=>{
		this.actions[type](this,payload);
	}
}

export default {
	Store,
	install
}