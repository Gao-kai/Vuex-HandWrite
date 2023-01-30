export let Vue;

export default function install(_Vue){
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