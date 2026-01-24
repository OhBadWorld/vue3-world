// ref 实现类 用于包装基本类型值  源码中是通过类来实现的 把基础类型变成对象类型，并拥有了依赖收集的能力

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