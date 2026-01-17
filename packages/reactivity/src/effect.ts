// 处理副作用的
export function effect(fn, options?) {
  // 创建一个响应式effect 数据变化之后，会重新执行fn函数

  // 创建一个effect, 只要依赖的属性变化了，就要执行回调（调度函数）
  const _effect = new ReactiveEffect(fn, () => {
    // 调度函数， 数据变化之后，会调用这个函数
    // scheduler 调度函数
    _effect.run();
  });
  _effect.run(); // 默认就要执行一次

  if (options) {
    console.log('options', options);
    Object.assign(_effect, options); // 用用户传的函数，覆盖掉内置的
  }
  const runner = _effect.run.bind(_effect); // 绑定this指向
  runner.effect = _effect; // 可以在run方法上获取到effect的引用
  return runner; // 外界可以用到这个runner
}

export let activeEffect: ReactiveEffect | null = null; // 全局变量， 表示当前激活的effect
function preCleanEffect(effect) {
  // 清除effect 中的依赖
  effect._depsLength = 0; // 依赖长度清空
  effect._trackId++; // 如果是当前同一个effect执行 都要增加一次_trackId
}

function postCleanEffect(effect) {
  // 老的effect.deps => [flag, name, xxxx, bbbb, ...]  // 多余的(xxxx,bbbb, xxx) 都需要删掉
  // 当前的effect.deps => [flag, age]

  // 清除effect 中的依赖
  if (effect.deps.length > effect._depsLength) {
    // 清除effect 中的依赖
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect, effect.deps[i]); // 删除映射表中对应的多余的effect
    }
    effect.deps.length = effect._depsLength; // 依赖长度更新
    // 先删除targetMap中的关系 再改变数组
  }
}



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

      // effect 执行前，需要把上一次的依赖清空
      preCleanEffect(this);


      return this.fn(); // 依赖收集
    } finally {
      postCleanEffect(this); // 执行完fn函数后，把当前effect 中的依赖清空
      activeEffect = lastEffect; // 执行完fn函数后，把activeEffect 赋值为上一个effect
    }
  }

  stop() {
    this.active = false; // 后续来实现
  }
}

function cleanDepEffect(effect, dep) {
  // 清除effect 中的依赖
  dep.delete(effect); // 从当前属性的依赖map（dep）中删除当前effect
  if (dep.size === 0) {
    // 如果当前属性的依赖map（dep）中没有任何effect了，就把当前属性的依赖map（dep）清空
    dep.cleanup();
  }
}

// 双向记忆
// 1. _trackId 用于记录执行次数（防止一个属性在当前effect中多次依赖收集），只收集一次
// 2. 拿到上一次依赖的最后一个 和 这一次的进行比较
// 收集齐dep记录了effect
// effect的deps 记录了dep
export function trackEffect(dep, effect) {
  // 需要重新收集依赖，将不需要的移除掉
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId); // 把effect 放到当前属性的依赖map（dep）中, 后续可以根据值的变化触发此dep中存放的effect

    let oldDep = effect.deps[effect._depsLength]; // 直接取出最后一个来进行比较，因为上一轮的已经清空了，所以最后一个就是第一个
    if (oldDep !== dep) {
      if (oldDep) {
        // 删除老的依赖
        cleanDepEffect(effect, oldDep); // 从上一个依赖中删除当前effect
      }
      // 新增新的依赖
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++;
    }

    return; // 如果当前dep 中已经有了当前的effect，就直接返回
  }


  // dep.set(effect, effect._trackId); // 把effect 放到当前属性的依赖map（dep）中, 后续可以根据值的变化触发此dep中存放的effect
  // // 还需要把 effectt 和 dep 关联起来
  // effect.deps[effect._depsLength++] = dep;

}

export function triggerEffect(dep) { // dep 是属性的依赖map 就是映射表（一个属性可能对应多个effect）
  // 触发依赖的effect， 收集的时候是一个个收集，触发的时候可能会多个同时触发
  for (let effect of dep.keys()) {
    console.log('effect', effect);
    if (effect.scheduler) {
      effect.scheduler(); // -> 等价于effect.run()
    }
    else {
      effect.run();
    }
  }
}