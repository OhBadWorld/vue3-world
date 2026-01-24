// ref 实现类 用于包装基本类型值  源码中是通过类来实现的 把基础类型变成对象类型，并拥有了依赖收集的能力
// ref 主要是针对reactive，当从reactive对象中解构取值时，避免丧失响应式

// reactive shallowReactive 区别是 shallowReactive 不会递归代理对象， 而 reactive 会递归代理对象

import { activeEffect, trackEffect, triggerEffect } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

// ref shallowRef 区别是 shallowRef 不会递归代理对象， 而 ref 会递归代理对象
export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  // ref 实现类 用于包装基本类型值  源码中是通过类来实现的
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true; // 增加ref标识
  public _value; // 用于存储本次 ref的 基本类型值
  public dep; // 用于收集对应的effect
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  // 类的属性访问器
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal;
      this._value = newVal;
      triggerRefValue(this);
    }
  }
}

// 收集ref的依赖
function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      ref.dep = createDep(() => ref.dep = undefined, 'undefined'),
      activeEffect
    );
  }
}
// 触发ref的依赖
function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffect(dep); // 触发ref的依赖 触发页面更新
  }
}

// toRef, toRefs 区别是 toRef 只能处理一个属性， 而 toRefs 可以处理多个属性
// toRef 用于将响应式对象的属性转换为 ref 对象
// toRefs 用于将响应式对象的所有属性转换为 ref 对象

class ObjectRefImpl {
  public __v_isRef = true; // 增加ref标识
  constructor(public _object, public _key) {
  }
  get value() {
    return this._object[this._key];
  }
  set value(newVal) {
    this._object[this._key] = newVal;
  }
}
export function toRef(Object, key) {
  return new ObjectRefImpl(Object, key);
}
export function toRefs(state) {
  let ret = {};
  for (let key in state) { // 挨个属性调用ref
    ret[key] = toRef(state, key);
  }
  return ret;
}

// 模板自动解包 ref 对象
// 模板中可以直接使用 ref 对象的 value 属性，而不需要使用 ref.value 来获取值
export function proxyRefs(ObjectWithRefs) {
  return new Proxy(ObjectWithRefs, {
    get(target, key, receiver) {
      let val = Reflect.get(target, key, receiver);
      return val.__v_isRef ? val.value : val; // 如果是ref对象，就返回ref对象的value属性，否则就返回原始值
    },
    set(target, key, value, receiver) {
      let val = Reflect.get(target, key, receiver);

      if (val.__v_isRef) {
        val.value = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver);
    }
  })
}