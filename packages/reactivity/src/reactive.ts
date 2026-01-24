import { isObject } from "@vue/shared";
import { ReactiveFlags, multableHandlers } from "./baseHandler";

// 响应式映射表 节约开销，避免每次都创建一个新的 proxy， 避免内存泄漏
// 记录代理后的结果，可以复用
const reactiveMap = new WeakMap(); // WeakMap es6 新特性， 键值对的集合， 键必须是对象， 值可以是任意值

const createReactiveObject = (target) => {
  // 统一做判断，响应式对象必须是对象才可以
  if (!isObject(target)) {
    return target;
  }

  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    // 如果有，直接返回, 取缓存
    return existingProxy;
  }
  let proxy = new Proxy(target, multableHandlers);
  // 根据目标对象，缓存映射， 查找是否有代理过的对象
  reactiveMap.set(target, proxy);
  return proxy;
};

// reactive / shallowReactive
// 专业处理响应式api
export function reactive(target) {
  return createReactiveObject(target);
};

// 解决2个问题，（循环引用问题， 性能问题）
// 1. 对象不能被重复代理，
// 2. 其次，已经被代理过的对象，也不能再次被代理 

// 为啥要使用 reflect 方法？
// 1. 可以避免无限循环的问题
// 2. 可以避免直接访问对象自身的属性，而是通过代理对象去访问代理对象的属性  

// 总体来讲 （targetMap在 reactiveEffect.ts 中）
// 映射表(targetMap)记录属性 对应的 effect实例， effectt实例上有run方法可以重新执行，set的时候调用当前effect实例的run方法就可以了


export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
} 
