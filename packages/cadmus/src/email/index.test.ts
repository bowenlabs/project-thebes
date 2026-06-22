import { describe, expect, it } from "vitest";
import { CadmusEmailError } from "../errors.js";
import { sendEmail } from "./index.js";

function fakeBinding(send: SendEmail["send"]): SendEmail {
  return { send };
}

describe("email", () => {
  it("sends a raw MIME message via the binding", async () => {
    let sentMessage: EmailMessage | undefined;
    const binding = fakeBinding(async (message) => {
      sentMessage = message;
    });

    await sendEmail(binding, {
      from: "noreply@example.com",
      to: "owner@example.com",
      subject: "Your magic link",
      html: '<p>Click <a href="https://example.com">here</a></p>',
    });

    expect(sentMessage).toBeDefined();
  });

  it("wraps a binding failure in CadmusEmailError", async () => {
    const binding = fakeBinding(async () => {
      throw new Error("send_email rejected");
    });

    await expect(
      sendEmail(binding, {
        from: "noreply@example.com",
        to: "owner@example.com",
        subject: "Your magic link",
        html: "<p>hi</p>",
      }),
    ).rejects.toBeInstanceOf(CadmusEmailError);
  });
});
