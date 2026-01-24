
import { isObject } from "@vue/shared";
import { reactive } from "./reactive";
import { track, trigger } from "./reactiveEffect";

// 响应式标志位 枚举编译后就是对象
// 因为这里是属性，而symbol是值，所以这里用属性来判断是否是响应式对象，因此使用的是 ReactiveFlags 枚举
// 响应式对象的标志位， 防止重复代理
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

// proxy 需要 搭配 reflect 使用（reflect 可以在代码执行的时候，修改代码的行为）
export const multableHandlers: ProxyHandler<any> = {
  // 收集依赖 target目标对象， p属性， receiver代理对象
  get(target, p, receiver) { // receiver 就是当前对象的代理对象，代理对象的实例
    // get方法是代理之后才会有的，而 ReactiveFlags.IS_REACTIVE 就是外面的属性， 访问了 ReactiveFlags.IS_REACTIVE ，就表示是当前get方法中的p参数， 所以这里判断参数p 是否是 ReactiveFlags.IS_REACTIVE， 是的话，就命中了
    if (p === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    // 取值的时候，是依赖收集 todo...
    track(target, p); // 收集这个对象上的这个属性 和 effect关联在一起

    // 当取值的时候，应该让响应式属性 和 effect 映射起来  （收集依赖）
    // return target[key]; // 这种方式有隐患， 如果对象中的方法又返回了当前对象的方法，而方式是读取对象的属性，这个时候直接走对象自身的属性，不会被代理，不会触发get方法
    // return receiver[key]; // 这种方式有隐患， 如果对象中的方法又返回了当前对象的属性，会一直不停的触发get方法，会导致无限循环
    let res = Reflect.get(target, p, receiver); // Reflect.get方法，让代理对象内部的this 指向了代理对象receiver， 而不是指向了目标对象
    if (isObject(res)) { // 懒代理 只有当取的值也是对象的时候，才会去代理这个对象 递归代理
      return reactive(res);
    }
    return res;
  },
  set(target, p, newValue, receiver) {
    // 找到属性，让对应的effect重新执行

    let oldValue = target[p];
    let result = Reflect.set(target, p, newValue, receiver);
    if (oldValue !== newValue) {
      // 触发更新 todo...
      trigger(target, p, newValue, oldValue);
    }
    return result;
  },
}