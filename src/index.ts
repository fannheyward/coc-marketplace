import { listManager, ExtensionContext, workspace } from "coc.nvim";
import Marketplace from "./marketplace";

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context;
  const { nvim } = workspace;

  subscriptions.push(listManager.registerList(new Marketplace(nvim)));
}
