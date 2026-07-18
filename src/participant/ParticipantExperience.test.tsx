import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { loadParticipantExperience } from "../application/participant/experience";
import { createFixedClock } from "../test-support/brewing";
import { ParticipantExperienceScreen } from "./ParticipantExperience";

describe("ParticipantExperienceScreen", () => {
  it("completes the accessible participant flow with fixed dependencies", async () => {
    const user = userEvent.setup();
    render(
      <ParticipantExperienceScreen
        experience={loadParticipantExperience()}
        seed="screen-test"
        clock={createFixedClock()}
        odoriDurationMs={1}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "三段仕込みをはじめる" }),
    );
    await user.click(
      screen.getByRole("button", { name: "動きの代替入力を使う" }),
    );
    await user.click(
      screen.getByRole("button", { name: "この感覚を仕込みへ" }),
    );
    await screen.findByRole("heading", { name: "仕込みを、少し休ませます。" });
    await screen.findByRole("heading", {
      name: "この一杯に、どの石川を重ねますか？",
    });
    await user.click(screen.getAllByRole("radio")[0]!);
    await user.click(
      screen.getByRole("button", { name: "土地の記憶を重ねる" }),
    );
    await user.click(screen.getByRole("radio", { name: /静かな夜/ }));
    await user.click(
      screen.getByRole("button", { name: "三段の仕込みを完了する" }),
    );

    expect(
      await screen.findByText("三段の仕込みが完了しました。"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Recipe ID: recipe-v1-/)).toBeInTheDocument();
  });

  it("runs the odori timer once after strict-mode-safe rendering", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ParticipantExperienceScreen
        experience={loadParticipantExperience()}
        seed="timer-test"
        clock={createFixedClock()}
        odoriDurationMs={100}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "三段仕込みをはじめる" }),
    );
    await user.click(
      screen.getByRole("button", { name: "動きの代替入力を使う" }),
    );
    await user.click(
      screen.getByRole("button", { name: "この感覚を仕込みへ" }),
    );
    await vi.advanceTimersByTimeAsync(100);
    expect(
      screen.getByRole("heading", {
        name: "この一杯に、どの石川を重ねますか？",
      }),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });
});
