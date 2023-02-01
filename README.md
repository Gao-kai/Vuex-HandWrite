# Vuex
统一管理状态
修改状态 响应式更新视图
给状态划分模块

vuex完全依赖vue
只能用在vue项目中 无法在其他地方使用


## actions
actions中放置一些共享的异步逻辑 可以异步可以同步 但是大多数是异步 不可以直接更新状态


全局状态state 响应式数据 渲染组件
组件可以直接提交mutation，然后更新state引起视图更新
更多的是组件先dispatch一个动作到Actions中，然后由action来进行提交，mutaion然后更新的操作

action中可以包含任意异步逻辑

A组件 调用getInfo接口 得到数据state 然后提交mutation更新state
B组件 调用getInfo接口 得到数据state 然后提交mutation更新state

这样子调用接口这个动作无法复用

所以可以这样子实现：
A组件 派发一个调用getInfo接口的动作 比如getInfoAction
B组件 派发一个调用getInfo接口的动作 比如getInfoAction

getInfoAction中统一进行提交和更新 

## mutation
mutation是唯一可以修改状态的地方


##  实现难点
1. commit中的箭头函数实现
2. getters中的计算属性 需要保证缓存
3. state需要借助vue实现响应式原理
4. get state的属性代理器


## 模块的收集
1. 模块取值
2. 模块可以是无限嵌套的
3. 模块中的方法是共享的 
4. namespaced 避免影响
5. 如果没有命名空间 那么getters都会定义在根store上面 因此会有重复key的风险
如果有命名空间 就可以通过命名空间来使用
所以最好使用命名空间
vuex.esm.js?2f62:876 [vuex] duplicate getter key: newAge

所以为了避免意外的风险 我们还是最好加上这个namespace


## 无命名空间
state会定义在根store上面 通过store.state.模块名.prop来访问
getters会直接合并到根store上面 通过 $store.getters.getterKey来访问 会造成重复key的问题
mutations和actions都会收集同名的放在一个数组中 会造成共享的问题

## 有命名空间
state同上
getters会定义在命名空间上 通过$store.getters['moduleA/newAge'] 这种路径分隔符拼接的来实现
actions和mutations会定义在命名空间上 通过$store.commit('moduleA/add',1) 这种路径实现

## 重新定义state冲突 以module为准
所以要注意声明在根state中的属性名不要和模块中state的key重复
否则会被模块的覆盖

## 命名空间
孙子模块加了namespace 儿子模块没有加

## 动态注册模块

## 数据持久化的方式
1. 重新渲染时访问后端接口
2. 存到前端本地 storage

## 实现vuex的插件机制


## mutation和action的区别
1. 用法不同
一个commit专门用来修改状态 
一个disptach专门用来复用异步逻辑的

2. 是否支持promise链式调用
 mutation的返回值不支持promise
 action支持 可以在外部then链式调用

3. 严格模式下
可以通过mutation修改状态
而直接通过dispatch修改状态会报错
开发的时候可以开启严格模式



## 辅助函数
模板中取vuex中的值 需要写一长串 很不优雅 是否可以简化呢
这就需要辅助函数

## 云服务项目


## 后台管理系统项目 4个难点
1. axios的高度封装(集合react的axios)
    取消请求
    自定义实例
    队列保存
    错误判断
    404
    
2. 权限设计
    比如组件级别
    比如按钮级别
    比如页面级别

3. 数据持久化
    如何做数据持久化

4. 大文件上传
    切片上传
    断点续传

5. webpack优化

6. 首屏渲染如何优化

7. 深挖webpack中的点