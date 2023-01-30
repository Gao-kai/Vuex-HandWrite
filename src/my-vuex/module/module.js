class Module{
	constructor(module){
		
		this._raw = module;
		this._children = {};
		this.state = module.state;
	}
	
	// 获取模块上的namespaced的时候 必须保证其实一个布尔值
	get namespaced(){
		return !! this._raw.namespaced;
	}
	
	addChild(key,module){
		this._children[key] = module;
	}
	
	getChild(key){
		return this._children[key];
	}
	
	forEachMutation(callback){
		if(this._raw.mutations){
			forEachValue(this._raw.mutations,callback);
		}
	}
	
	forEachActions(callback){
		if(this._raw.actions){
			forEachValue(this._raw.actions,callback);
		}
	}
	
	forEachGetters(callback){
		if(this._raw.getters){
			forEachValue(this._raw.getters,callback);
		}
	}
	
	forEachModules(callback){
		// this._raw.modules是原始的未经过格式化的模块
		// this._children中装的是经过格式化的模块 这里要循环包装后的模块 也就是Module类的实例才可以
		forEachValue(this._children,callback);
	}
}

/* 
	工具函数
	将对象obj上每一个属性key和value取出来
	分别当做参数传递给callback执行
 */
function forEachValue(obj,callback){
	Object.keys(obj).forEach((key)=>{
		callback(key,obj[key]);
	})
}

export default Module;