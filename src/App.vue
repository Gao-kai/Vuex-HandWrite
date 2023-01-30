<template>
	<div id="app">
		<div id="nav">
			$store.state.age：{{age}}
			<br />
			$store.getters.newAge：{{$store.getters.newAge}}
			$store.getters.newAge：{{$store.getters.newAge}}
			$store.getters.newAge：{{$store.getters.newAge}}
			$store.getters.newAge：{{$store.getters.newAge}}
			
			<button @click="$store.commit('add',10)">mutation更新state</button>
			<button @click="add(5)">action更新state</button>
			<button @click="directiveAge()">直接更新state</button>
			
		</div>
		
		<div style="margin-top: 20px;">
			<h1>A模块</h1>
			a的age是：{{$store.state.moduleA.age}}
			<br>
			a的getters的newAge是：{{$store.getters['moduleA/newAge']}}
			
			<button @click="$store.commit('moduleA/add',1)">mutation更新state</button>
		</div>
		
		<div style="margin-top: 20px;">
			<h1>B模块</h1>
			b的age是：{{$store.state.moduleB.age}}
			<button @click="$store.commit('moduleB/add',1)">mutation更新state</button>
		</div>
		
		<div style="margin-top: 20px;">
			<h1>C模块</h1>
			c的age是：{{$store.state.moduleA.moduleC.age}}
			<button @click="$store.commit('moduleA/moduleC/add',10)">mutation更新state</button>
		</div>
		
		<div style="margin-top: 20px;">
			<h1>动态X模块</h1>
			c的age是：{{$store.state.moduleB.moduleX.age}}
			<br>
			c的getters的newAge是：{{$store.getters['moduleB/moduleX/newAge']}}
			<button @click="$store.commit('moduleB/moduleX/add',500)">mutation更新state</button>
		</div>
		
		
		
		
	</div>
</template>

<script>
// import { mapState } from 'vuex';

/* 将store.state.key 转化为 计算属性也就是函数取值 少些几个字母 */
function mapState(stateKeyList){
	let obj = {};
	for (const stateKey of stateKeyList) {
		obj[stateKey] = function(){
			return this.$store.state[stateKey];
		}
	}
	return obj;
}

// 等于就是一个语法糖 
function mapActions(actionKeyList){
	let obj = {};
	for (const actionKey of actionKeyList) {
		obj[actionKey] = function(payload){
			return this.$store.dispatch(actionKey,payload);
		}
	}
	return obj;
}
export default {
	computed:{
		...mapState(['age'])

		/* 
			转化为这样子：
			age:()=>{
				return this.$store.state.age;
			}
		*/
	},
	methods:{
		addAge(){
			this.$store.commit('add',10);
		},
		...mapActions(['add']),
		// dispatchAge(){
		// 	let p = this.$store.dispatch('add',2);
		// 	p.then(res=>{
		// 		console.log('dispatch完成,状态已修改');
		// 	})
		// },
		directiveAge(){
			this.$store.state.age++;
		}
		
	},
	mounted() {
		console.log(this.$store)
	}
}
</script>
