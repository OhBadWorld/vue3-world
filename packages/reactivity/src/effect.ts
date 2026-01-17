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
