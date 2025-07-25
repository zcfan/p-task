import { useEffect, useState } from 'react'
import PTask, { type PTaskStatus } from '../lib/main'

function App() {
  const [status, setStatus] = useState<PTaskStatus>('pending')
  const [result, setResult] = useState<number | undefined>()

  useEffect(() => {
    const task1 = new PTask([], () => new Promise<number>(resolve => setTimeout(() => resolve(1), 500)))
    const task2 = new PTask([], () => new Promise<string>(resolve => setTimeout(() => resolve('2'), 1000)))
    const task3 = new PTask([task1, task2], ([result1, result2]) => new Promise<number>(resolve => setTimeout(() => resolve(result1 + Number(result2)), 500)))
    const cb = () => {
      setStatus(task3.status)
      setResult(task3.value)
    }
    task3.onChange(cb)
    return () => {
      task3.offChange(cb)
    }
  }, [])

  return (
    <>
      <h1>PTask</h1>
      <div>{status}</div>
      <div>{result}</div>
    </>
  )
}

export default App