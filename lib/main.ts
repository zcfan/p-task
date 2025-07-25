/* eslint-disable @typescript-eslint/no-explicit-any */
export type PTaskStatus =
  // 依赖任务或当前任务本身有 error，则整体为 error
  | "error"
  // 依赖任务和当前任务都没有 error，依赖任务和当前任务有 pending，则整体为 pending
  | "pending"
  // 依赖任务和当前任务都为 success，则整体为 success
  | "success";

type _PTaskStatus = PTaskStatus | "idle";

/** 把 PTask 元组转换为结果元组 */
type PTaskTuple2ResultTuple<T extends readonly PTask<unknown, any>[] | []> = {
  -readonly [P in keyof T]: T[P] extends PTask<infer R, any> ? R : never;
};

/** 状态变更回调 */
type ChangeCallback<R, D extends readonly PTask<unknown, []>[]> = (
  task: PTask<R, D>
) => void;

/**
 * 可以组合成为更大的任务，并将组合后的任务视作一个单独的任务操作
 * - 重试
 * - 获取状态
 * - 监听状态变化
 */
export default class PTask<R = unknown, D extends readonly PTask<unknown, any>[] | [] = any> {
  private onRun: (depResults: PTaskTuple2ResultTuple<D>) => Promise<R>;
  public deps: D;
  /** 这个任务本身的状态，不考虑它的依赖 */
  private _status: _PTaskStatus = "idle";
  /** 这个任务以及它的依赖整体的状态 */
  public status: PTaskStatus = "pending";
  private onChangeCbs: ChangeCallback<R, D>[] = [];
  public promise?: Promise<R>;
  public value?: R;
  public error: any;

  constructor(
    deps: D,
    onRun: (depResults: PTaskTuple2ResultTuple<D>) => Promise<R>
  ) {
    this.deps = deps;
    this.onRun = onRun;

    // 没有依赖，立刻执行本任务
    if (deps.length === 0) {
      this.run();
      return;
    }

    // callback 要被传来传去，this 绑定到当前 PTask 上
    this.depChangeCallback = this.depChangeCallback.bind(this);
    deps.forEach((dep) => dep.onChange(this.depChangeCallback));
  }

  depChangeCallback(task: PTask<unknown, any>) {
    if (task.status === "error") {
      this.changeStatus("error");
      return;
    }

    if (task.status === "success") {
      // 已经成功的依赖，不需要继续监听状态变化
      task.offChange(this.depChangeCallback);
      const depsReady = this.deps.every((task) => task.status === "success");
      if (depsReady) this.run();
    }
  }

  /**
   * 尝试运行一个 PTask
   * 如果 PTask 依赖中有 error 或 pending 状态，则本任务不会执行，但
   * 会重试 error 的依赖
   */
  run() {
    if (this._status === "pending" || this._status === "success") return;
    this._status = "pending";
    this.changeStatus("pending");

    const result = this.onRun(
      this.deps.map((dep) => dep.value) as PTaskTuple2ResultTuple<D>
    );

    if (result instanceof Promise) {
      this.promise = result
        .then((result: R) => {
          this.value = result;
          this._status = "success";
          this.changeStatus("success");
          return result;
        })
        .catch((error: any) => {
          this.error = error;
          this._status = "error";
          this.changeStatus("error");
          return error;
        });
    } else {
      this.value = result;
      this._status = "success";
      this.changeStatus("success");
    }
  }

  retry() {
    if (this._status === "error") this.run();
    if (this.status === "error") {
      this.deps.forEach((dep) => {
        if (dep.status === "error") {
          dep.retry();
        }
      });
      this.changeStatus("pending");
    }
  }

  /**
   * 注册状态变化监听器
   */
  onChange(cb: ChangeCallback<R, D>) {
    this.onChangeCbs.push(cb);
    // 监听后触发一次，放在 setTimeout 中是因为编辑消息时，需要等待状态库的逻辑把乐观更新相关的字段插入到原本的真实消息中。
    cb(this);
  }

  /**
   * 取消注册状态变化监听器
   * cb 需要是和 onChange 时一致的引用
   */
  offChange(cb: ChangeCallback<R, D>) {
    this.onChangeCbs.splice(this.onChangeCbs.indexOf(cb), 1);
  }

  /**
   * 不可直接改变 this._status，所有变化都通过这个方法操作，确保触发状态变化监听器
   */
  private changeStatus(status: PTaskStatus) {
    if (this.status === status) return;
    this.status = status;
    this.onChangeCbs.forEach((cb) => cb(this));
  }
}
