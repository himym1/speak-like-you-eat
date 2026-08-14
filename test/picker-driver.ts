import type { KeybindingsManager, Theme } from "@earendil-works/pi-coding-agent";
import type { Component, TUI } from "@earendil-works/pi-tui";

type ModelPickerComponent = Component & {
  handleInput?: (data: string) => void;
};

type ModelPickerFactory<Result> = (
  tui: TUI,
  theme: Theme,
  keybindings: KeybindingsManager,
  done: (result: Result) => void,
) => ModelPickerComponent | Promise<ModelPickerComponent>;

export function createModelPickerDriver(inputs: string[]) {
  const renders: string[] = [];
  let completionCount = 0;
  const keybindings = {
    matches(data: string, binding: string) {
      return (
        (binding === "tui.select.cancel" && (data === "\u001b" || data === "\u0003")) ||
        (binding === "tui.input.tab" && data === "\t") ||
        (binding === "tui.select.up" && data === "\u001b[A") ||
        (binding === "tui.select.down" && data === "\u001b[B") ||
        (binding === "tui.select.confirm" && data === "\r")
      );
    },
  } as KeybindingsManager;
  const theme = {
    fg(_color: string, text: string) {
      return text;
    },
    bold(text: string) {
      return text;
    },
  } as Theme;

  async function run<Result>(factory: ModelPickerFactory<Result>): Promise<Result> {
    return new Promise((resolve) => {
      const done = (result: Result) => {
        completionCount += 1;
        resolve(result);
      };
      void Promise.resolve(factory({ requestRender() {} } as TUI, theme, keybindings, done)).then((picker) => {
        renders.push(picker.render(80).join("\n"));
        for (const input of inputs) {
          picker.handleInput?.(input);
          renders.push(picker.render(80).join("\n"));
        }
      });
    });
  }

  return {
    renders,
    get completionCount() {
      return completionCount;
    },
    run,
  };
}
