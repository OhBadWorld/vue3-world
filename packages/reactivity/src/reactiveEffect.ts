// 收集依赖
import { activeEffect } from "./effect";

export function track(target, p) {
  // 收集这个对象上的这个属性 和 effect关联在一起
  // activeEffect 有这个属性，说明这个p(key的意思，属性) 是在effect中访问的
  // 没有说明在 effect之外访问的，不用进行收集
  if (!activeEffect) {
    return;
  }
  console.log(activeEffect, p);
}


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