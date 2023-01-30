/* 

	用户传入的无法确定明显的父子关系 所以需要格式化
	将用户传入的options进行格式化操作
	递归构建 并且在这个过程中确定父子关系
	
	{
		_raw:用户自己定义的对象,
		state:用户自己定义的对象.state
		-children:{
			moduleA:{
				_raw:用户自己定义的对象,
				state:用户自己定义的对象.state,
				-children:{
					moduleC:{
						_raw:用户自己定义的对象,
						state:用户自己定义的对象.state,
						-children:{}
					},
				}
			},
			moduleB:{
				_raw:用户自己定义的对象,
				state:用户自己定义的对象.state,
				-children:{}
			}
		}
	}
 */

/* 
	模块收集
	本质就是迭代树形结构 并且在这个过程中维护模块之间的父子关系
	
	如何记录父子关系？
	AST语法树 中是通过栈来实现的 
	[div]
	[div,p] p是div的孩子
	[div,p,span] span是p的孩子
	[div,p,span,span]span弹出
	
 */
import Module from './module.js';
export default class ModuleCollection {
	constructor(options) {
		let stack = [];
		this.root = null;
		this.register(stack, options);
	}
	
	// 基于模块名路径 获取拼接的命名空间
	getNameSpace(moduleNames){
		let startModule = this.root;
		let namespace = moduleNames.reduce((str,moduleName)=>{
			startModule = startModule.getChild(moduleName);
			return str + (startModule.namespaced ? `${moduleName}/`:'');
		},"")
		return namespace;
	}

	register(moduleNames, rootModule) {
		let newModule = new Module(rootModule);
		// rootModule是用户传入的配置对象  newModule是我们格式化后的原型上具有很多遍历方法的对象
		// 将两者联系起来 可以在旧的用户传入的配置对象上通过newModule属性取到格式化后的对象
		rootModule.newModule = newModule;

		if (!this.root) {
			this.root = newModule;
		} else {
			/* 
				如何确定父子关系
				假设当前path为：['moduleA','moduleC','moduleD']
				需要将moduleD定义在moduleC对于的对象的_chidlren上面
				所以必须先找到moduleD的父亲parent 
				也就是moduleC对应的对象的_chidlren上面
				
				path为['moduleA'] _path为[]  parent = this.root;
				将moduleA定义在了this.root._chidlren上
				
				path为['moduleA','moduleC'] _path为['moduleA']  parent = this.root._chidlren['moduleA']
				将moduleC定义在了parent上 
			 */
			
			let parentModuleNames = moduleNames.slice(0,-1);
			let parentModule = this.root;
			for (var i = 0; i < parentModuleNames.length; i++) {
				let moduleName = parentModuleNames[i];
				parentModule = parentModule.getChild(moduleName);
				// parentModule = parentModule._chidlren[moduleName];
			}
			
			/*
				将childModuleName子模块添加在当前的_chidlren上
				栈中最后一项是子模块名称
				栈中最后一项的前一项是父模块名称，但是为了找到父模块需要循环查找
			 */
			let childModuleName = moduleNames[moduleNames.length - 1];
			parentModule.addChild(childModuleName,newModule);
		}

		// 如果传入的options上有modules属性 需要递归构建
		if (rootModule.modules) {
			let childModuleNames = Object.keys(rootModule.modules);
			for (var i = 0; i < childModuleNames.length; i++) {
				let childModuleName = childModuleNames[i];
				let childModuleOptions = rootModule.modules[childModuleName];
				/*
					递归构建 
					['moduleA'] 将A定义到root的_children上
					['moduleA','moduleC'] 将C定义到moduleA的_children上
					['moduleA','moduleC','moduleD'] 将D定义到moduleC的_children上
				 */
				this.register(moduleNames.concat(childModuleName), childModuleOptions);
			}
			
		}
	}
}
