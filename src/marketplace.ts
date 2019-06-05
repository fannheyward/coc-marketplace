import { extensions, workspace, BasicList, ListContext, ListItem, Neovim } from 'coc.nvim';
import axios from 'axios';

interface IExtension {
  name: string;
  label: string;
  installed: boolean;
}

export default class Marketplace extends BasicList {
  public readonly name = 'marketplace';
  public readonly description = 'coc.nvim extensions marketplace';
  public readonly detail = 'display all coc.nvim extensions in list, with an install action';
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

    this.addAction('uninstall', async item => {
      if (!item.data.installed) {
        return;
      }
      const name = item.data.name;
      let res = await workspace.showPrompt(`Uninstall extension ${name}?`);
      if (!res) {
        return;
      }
      await nvim.command(`CocUninstall ${name}`);
    });
  }

  public async loadItems(context: ListContext): Promise<ListItem[]> {
    const { args } = context;
    let query: string = args.length ? args[0] : '';

    let items: ListItem[] = [];
    const exts = await this.fetchExtensions();
    for (const ext of exts) {
      if (query && query.length > 0) {
        if (ext.name.indexOf(query) < 0) {
          continue;
        }
      }

      items.push({
        label: ext.label,
        data: {
          installed: ext.installed,
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
        if (res.status !== 200) {
          return [];
        }

        return this.format(res.data);
      })
      .catch(_ => {
        return [];
      })
      .finally(() => {
        statusItem.hide();
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

      let sign = '';
      if (pkg.publisher.username === 'chemzqm' || pkg.publisher.email === 'chemzqm@gmail.com') {
        sign = '*';
      }

      let isInstalled = false;
      for (const e of extensions.all) {
        if (e.id === pkg.name) {
          sign = '√';
          isInstalled = true;
          break;
        }
      }
      if (!isInstalled && sign !== '*')
        sign = '×';

      exts.push({
        name: pkg.name,
        label: (`[${sign}] ${pkg.name} ${pkg.version}`).padEnd(30) + pkg.description,
        installed: isInstalled
      });
    }

    return exts;
  }
}
