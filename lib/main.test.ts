import { it, expect, vi } from 'vitest'
import PTask from './main'

it('deps 有 error，整体状态为 error', async () => {
    const dep1 = new PTask([], vi.fn().mockRejectedValue(1));
    const dep2 = new PTask([], vi.fn().mockResolvedValue(1));
    const task = new PTask([dep1, dep2], vi.fn());
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(task.status).toBe('error');
});

it('deps 有 pending，整体状态为 pending', async () => {
    const dep1 = new PTask([], vi.fn().mockResolvedValue(1));
    const dep2 = new PTask([], () => new Promise(() => undefined));
    const task = new PTask([dep1, dep2], vi.fn());
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(task.status).toBe('pending');
});

it('deps 都 success，当前任务有错，整体状态为 error', async () => {
    const dep1 = new PTask([], vi.fn().mockResolvedValue(1));
    const dep2 = new PTask([], vi.fn().mockResolvedValue(1));
    const task = new PTask([dep1, dep2], vi.fn().mockRejectedValue(1));
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(task.status).toBe('error');
});

it('deps 都 success，当前任务 pending，整体状态为 pending', async () => {
    const dep1 = new PTask([], vi.fn().mockResolvedValue(1));
    const dep2 = new PTask([], vi.fn().mockResolvedValue(1));
    const task = new PTask([dep1, dep2], () => new Promise(() => undefined));
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(task.status).toBe('pending');
});

it('deps 都 success，当前任务 success，整体状态为 success', async () => {
    const dep1 = new PTask([], vi.fn().mockResolvedValue(1));
    const dep2 = new PTask([], vi.fn().mockResolvedValue(1));
    const task = new PTask([dep1, dep2], vi.fn().mockResolvedValue(1));
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(task.status).toBe('success');
});

it('deps 部分有 error，应只重试有错的 dep', async () => {
    const cb1 = vi.fn().mockRejectedValueOnce(1).mockResolvedValueOnce(1);
    const cb2 = vi.fn().mockResolvedValueOnce(1);
    const dep1 = new PTask([], cb1);
    const dep2 = new PTask([], cb2);
    const cb3 = vi.fn().mockRejectedValueOnce(1).mockResolvedValueOnce(1);
    const task = new PTask([dep1, dep2], cb3);
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(task.status).toBe('error');
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(0);

    task.retry();
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(1);
    expect(task.status).toBe('error');

    task.retry();
    expect(task.status).toBe('pending');
    await waitStatusChange(task);
    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(2);
    expect(task.status).toBe('success');
});

it('任务如果返回的不是 Promise，则视作立即成功', async () => {
    const task = new PTask([], vi.fn().mockReturnValue(1));
    expect(task.status).toBe('success');

    const dep1 = new PTask([], vi.fn().mockReturnValue(1));
    const dep2 = new PTask([dep1], vi.fn().mockReturnValue(1));
    const dep3 = new PTask([dep2], vi.fn().mockReturnValue(1));
    const task2 = new PTask([dep3], vi.fn().mockReturnValue(1));
    expect(task2.status).toBe('success');
});

async function waitStatusChange(task: PTask) {
  return new Promise((resolve) => {
    const cb = (task: PTask) => {
      task.offChange(cb);
      resolve(task.status);
    };
    task.onChange(cb);
  });
}
