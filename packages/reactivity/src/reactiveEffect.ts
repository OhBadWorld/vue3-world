// 收集依赖
import { activeEffect, trackEffect, triggerEffect } from "./effect";

const targetMap = new WeakMap(); // 目标对象的map ， 存储的是目标对象和属性的映射关系
export const createDep = (cleanup, key) => {
  const dep = new Map() as any; // 创建的收集器还是map, 只是在上面添加了 自定义的属性 和 方法 属性的依赖map
  dep.cleanup = cleanup; // 添加的自定义属性（方法） 添加清理函数 清理依赖的函数
  dep.name = key; // 添加的自定义属性（属性） 添加属性key 用来给cleanup 函数使用的
  return dep;
}; // 创建属性的依赖map


export function track(target, p) {
  // 收集这个对象上的这个属性 和 effect关联在一起
  // activeEffect 有这个属性，说明这个p(key的意思，属性) 是在effect中访问的
  // 没有说明在 effect之外访问的，不用进行收集
  if (!activeEffect) {
    return;
  }
  // console.log(activeEffect, p);
  let depsMap = targetMap.get(target); // 先从map中取出目标对象的属性map
  if (!depsMap) { // 如果没有，就创建一个
    targetMap.set(target, (depsMap = new Map())); // 把属性map 放到目标对象的map中
  }

  let dep = depsMap.get(p); // 从属性map中取出属性的依赖map
  if (!dep) { // 如果没有，就创建一个
    depsMap.set(p, dep = createDep(() => depsMap.delete(p), p)); // 后面清理不需要的属性
  }

  trackEffect(dep, activeEffect); // 把effect 放到当前属性的依赖map（dep）中, 后续可以根据值的变化触发此dep中存放的effect
  console.log('targetMap', targetMap);
}

export function trigger(target, p, newValue, oldValue) {
  // 触发更新 todo...
  let depsMap = targetMap.get(target); // 先从map中取出目标对象的属性map
  if (!depsMap) { // 如果没有，就直接返回
    return;
  }

  let dep = depsMap.get(p); // 从属性map中取出属性的依赖map
  if (!dep) { // 如果没有，就直接返回
    return;
  }
  // 修改的属性对应上了effect， 触发更新
  triggerEffect(dep); // 触发依赖的effect， 收集的时候是一个个收集，触发的时候可能会多个同时触发
};



// Map
// {
//  obj: {
//      属性：{
//        effect(Map): [effect1, effect2]
//      }
// }
// }
// 收集依赖，结构类似 Map 如下：
// {
//   {name: 'zhang', age: 30}: {
//     name: {
//       effect: [effect1, effect2]
//     },
//     age: {
//       effect: [effect1]
//     }
//   }
// }