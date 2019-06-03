import { workspace, BasicList, ListContext, ListItem, Neovim } from 'coc.nvim';
import axios from 'axios';

interface IExtension {
  name: string;
  label: string;
}

export default class Marketplace extends BasicList {
  public readonly name = 'marketplace';
  public readonly description = 'marketplace desc';
  public readonly detail = 'marketplace details';
  public readonly defaultAction = 'install';

  constructor(nvim: Neovim) {
    super(nvim);

    this.addAction('install', async item => {
      const name = item.data.name;
      let res = await workspace.showPrompt(`Install extension ${name}?`);
      if (!res) {
        return;
      }
      await nvim.command(`CocInstall ${name}`);
    });
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    let exts = await this.fetchExtensions();
    if (exts.length === 0) {
      return [];
    }

    let items: ListItem[] = [];
    for (const ext of exts) {
      items.push({
        label: ext.label,
        data: {
          name: ext.name
        }
      });
    }

    return items;
  }

  async fetchExtensions(): Promise<IExtension[]> {
    let statusItem = workspace.createStatusBarItem(0, { progress: true });
    statusItem.text = 'Loading...';
    statusItem.show();

    const uri = 'http://registry.npmjs.com/-/v1/search?text=keywords:coc.nvim&size=200';

    return axios
      .get(uri)
      .then(res => {
        statusItem.hide();

        if (res.status !== 200) {
          return [];
        }

        return this.format(res.data);
      })
      .catch(_ => {
        statusItem.hide();
        return [];
      });
  }

  private format(body: any): IExtension[] {
    // TODO check body.total for paging
    let exts: IExtension[] = [];
    for (const item of body.objects) {
      let pkg = item.package;
      if (pkg.name === 'coc.nvim' || pkg.name === 'coc-marketplace') {
        continue;
      }

      let official = '';
      if (pkg.publisher.username === 'chemzqm' || pkg.publisher.email === 'chemzqm@gmail.com') {
        official = '*';
      }

      exts.push({
        name: pkg.name,
        label: (pkg.name + official).padEnd(20) + pkg.description
      });
    }

    return exts;
  }
}
