@zcfan/p-task
----

```bash
npm i @zcfan/p-task
```

A tool for creating and managing the dependencies between asynchronous tasks.

For example, you have three tasks:
- task1/2 has no dependencies, so after being created, they can run immediately after creation.
- task3 depends on task1/2, so it'll run after task1/2 are `success`.

You can write them like this:

```typescript
const task1 = new PTask(
    [], 
    () => new Promise<number>(resolve => setTimeout(() => resolve(1), 500))
)
const task2 = new PTask(
    [], 
    () => new Promise<string>(resolve => setTimeout(() => resolve('2'), 1000))
)
const task3 = new PTask(
    [task1, task2], 
    ([result1, result2]) => 
        new Promise<number>(resolve => setTimeout(() => resolve(result1 + Number(result2)), 500))
)
```

Together they form a bigger task(task3) which can help you treak all three tasks as a single task:

- Get the final status:
  - any task is `error`, the bigger task is `error`.
  - if there is no `error`, any task is `pending`, the bigger task is `pending`.
  - if all tasks are `success`, the bigger task is `success`.

- Retry the bigger task:
  - if the bigger task is `error`, you can retry it by calling `retry()`.
  - it will only retry those `error` dependent tasks(or the bigger task itself, if it's `error`).
  - those `success` or `pending` dependent tasks will not be retried.

> A real example: to implement a "send messages that contain images" feature in an instant chat system, there are two backend endpoints:
> - upload images that will be used in message.
> - send the message.
> 
> Before sending a message, you need to upload all the images it uses first, and then send the message (images are represented by ids).
> 
> If the image upload fails, or the image upload is successful but the message send fails, user are allowed to retry.

----
一个用于创建和管理异步任务之间的依赖关系的工具。

比如有三个任务：
- task1/2 没有依赖，所以在创建后可以立即运行。
- task3 依赖于 task1/2，所以它会在 task1/2 成功后运行。

你可以这样写：

```typescript
const task1 = new PTask(
    [], 
    () => new Promise<number>(resolve => setTimeout(() => resolve(1), 500))
)
const task2 = new PTask(
    [], 
    () => new Promise<string>(resolve => setTimeout(() => resolve('2'), 1000))
)
const task3 = new PTask(
    [task1, task2], 
    ([result1, result2]) => 
        new Promise<number>(resolve => setTimeout(() => resolve(result1 + Number(result2)), 500))
)
```

这三个任务组合起来，形成一个更大的任务(task3)，你可以把它们作为一个单独的任务来看待。

- 获取大任务的整体状态：
  - 任何任务是 `error`，则较大的任务是 `error`。
  - 如果没有 `error`，任何任务是 `pending`，则较大的任务是 `pending`。
  - 如果所有任务都是 `success`，则较大的任务是 `success`。

- 重试大任务：
  - 如果大任务是 `error`，你可以通过调用 `retry()` 来重试它。
  - 它只会重试那些 `error` 的依赖任务（或者如果 task3 自己是 `error`，则会重试 task3）。
  - 那些依赖于 `success` 或 `pending` 的任务不会被重试。

> 一个现实的例子：要实现一个即时聊天系统的发送图文消息功能，后台有两个接口：
> - 上传图片
> - 发送消息
> 
> 在发送一条消息之前，需要先把它用到的图片上传完，然后再发送消息（其中图片用 id 表示）。
> 
> 如果图片发送失败，或图片上传成功但发送消息失败，都需要允许用户重试。
