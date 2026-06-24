import { describe, expect, it } from "vitest";
import { CadmusQueueError } from "../errors.js";
import { enqueue, processBatch } from "./index.js";

function fakeQueue<T>(send: Queue<T>["send"]): Queue<T> {
  return { send } as Queue<T>;
}

function fakeMessage<T>(body: T, attempts = 1) {
  const calls = { acked: false, retried: false };
  const message = {
    body,
    attempts,
    ack: () => {
      calls.acked = true;
    },
    retry: () => {
      calls.retried = true;
    },
  };
  return { message, calls };
}

function fakeBatch<T>(messages: ReturnType<typeof fakeMessage<T>>[]) {
  return { messages: messages.map((m) => m.message) } as MessageBatch<T>;
}

describe("queues", () => {
  it("sends a message via the queue binding", async () => {
    let sent: unknown;
    const queue = fakeQueue<{ foo: string }>(async (message) => {
      sent = message;
    });

    await enqueue(queue, { foo: "bar" });

    expect(sent).toEqual({ foo: "bar" });
  });

  it("wraps a send failure in CadmusQueueError", async () => {
    const queue = fakeQueue(async () => {
      throw new Error("queue full");
    });

    await expect(enqueue(queue, { foo: "bar" })).rejects.toBeInstanceOf(
      CadmusQueueError,
    );
  });

  it("acks messages the handler resolves normally", async () => {
    const a = fakeMessage({ id: 1 });
    const b = fakeMessage({ id: 2 });

    await processBatch(fakeBatch([a, b]), async () => {});

    expect(a.calls.acked).toBe(true);
    expect(b.calls.acked).toBe(true);
  });

  it("retries a message whose handler throws, without blocking the rest of the batch", async () => {
    const failing = fakeMessage({ id: 1 });
    const succeeding = fakeMessage({ id: 2 });

    await processBatch(fakeBatch([failing, succeeding]), async (body) => {
      if ((body as { id: number }).id === 1) throw new Error("boom");
    });

    expect(failing.calls.retried).toBe(true);
    expect(failing.calls.acked).toBe(false);
    expect(succeeding.calls.acked).toBe(true);
  });

  it("passes the message's delivery attempt count to the handler", async () => {
    const seen: number[] = [];
    const message = fakeMessage({ id: 1 }, 3);

    await processBatch(fakeBatch([message]), async (_body, { attempts }) => {
      seen.push(attempts);
    });

    expect(seen).toEqual([3]);
  });
});
