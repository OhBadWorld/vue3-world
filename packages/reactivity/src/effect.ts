// 处理副作用的
export function effect(fn, options: any = {}) {
  // 创建一个响应式effect 数据变化之后，会重新执行fn函数

  // 创建一个effect, 只要依赖的属性变化了，就要执行回调（调度函数）
  const _effect = new ReactiveEffect(fn, () => {
    // 调度函数， 数据变化之后，会调用这个函数
    // scheduler 调度函数
    _effect.run();
  });
  _effect.run(); // 默认就要执行一次

  return _effect;
}

export let activeEffect: ReactiveEffect | null = null; // 全局变量， 表示当前激活的effect

// 后续 effectSoped.stop()  方法 可以停止所有的effect 不参加响应式处理

class ReactiveEffect{
  _trackId = 0; // 表示当前effect执行了几次
  deps = []; // 表示当前effect 依赖了哪些属性依赖
  _depsLength = 0; // 表示当前effect 依赖了多少个属性依赖

  public active = true; // 表示默认创建的effect就是响应式对象

  // fn 就是用户传递的函数 如果fn中依赖的数据发生变化后，需要重新调度-> run()
  // scheduler 就是调度函数
  constructor(public fn, public scheduler) {
    this.fn = fn;
  }
  run() {
    if (!this.active) {
      return this.fn(); // 如果effect 不是激活状态，就直接执行fn函数,不做额外的处理
    }
    let lastEffect = activeEffect;
    try {
      // 额外处理...
      activeEffect = this; // 把当前的effect 赋值给 activeEffect
      return this.fn(); // 依赖收集
    } finally {
      activeEffect = lastEffect; // 执行完fn函数后，把activeEffect 赋值为上一个effect
    }
  }

  stop() {
    this.active = false; // 后续来实现
  }
}

// 双向记忆
// 收集齐dep记录了effect
// effect的deps 记录了dep
export function trackEffect(dep, effect) {
  dep.set(effect, effect._trackId); // 把effect 放到当前属性的依赖map（dep）中, 后续可以根据值的变化触发此dep中存放的effect
  // 还需要把 effectt 和 dep 关联起来
  effect.deps[effect._depsLength++] = dep;

}

export function triggerEffect(dep) { // dep 是属性的依赖map 就是映射表（一个属性可能对应多个effect）
  // 触发依赖的effect， 收集的时候是一个个收集，触发的时候可能会多个同时触发
  for (let effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler(); // -> 等价于effect.run()
    } else {
      effect.run();
    }
  }
}