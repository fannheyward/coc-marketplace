import { BasicList, commands, ExtensionInfo, extensions, fetch, ListContext, ListItem, Neovim, window, workspace } from 'coc.nvim';

interface ExtensionItem {
  name: string;
  label: string;
  homepage: string;
  installed: boolean;
}

export default class Marketplace extends BasicList {
  public readonly name = 'marketplace';
  public readonly description = 'coc.nvim extensions marketplace';
  public readonly detail = 'display all coc.nvim extensions in list, with an install action';
  public readonly defaultAction = 'install';
  private npmsio = workspace.getConfiguration('marketplace').get('npmsio', false);
  private installed: ExtensionInfo[] = [];

  constructor(nvim: Neovim) {
    super(nvim);

    this.addAction('install', async item => {
      await nvim.command(`CocInstall ${item.data.name}`);
    });

    this.addAction('uninstall', async item => {
      if (!item.data.installed) {
        return;
      }
      await nvim.command(`CocUninstall ${item.data.name}`);
    });

    this.addAction('homepage', async item => {
      if (item.data.homepage) {
        commands.executeCommand('vscode.open', item.data.homepage).catch(() => {
          // noop
        });
      }
    });
  }

  public async loadItems(context: ListContext): Promise<ListItem[]> {
    this.installed = await extensions.getExtensionStates();

    const { args } = context;
    let query = '';
    if (args && args.length > 0) {
      for (const arg of args) {
        if (arg.startsWith('--')) {
          continue;
        }

        query = arg;
      }
    }

    const items: ListItem[] = [];
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
          homepage: ext.homepage,
          name: ext.name
        }
      });
    }
    items.sort((a, b) => {
      return b.label.localeCompare(a.label);
    });

    return items;
  }

  async fetchExtensions(): Promise<ExtensionItem[]> {
    const statusItem = window.createStatusBarItem(0, { progress: true });
    statusItem.text = 'Loading...';
    statusItem.show();

    let uri = 'https://registry.npmjs.com/-/v1/search?text=keywords:coc.nvim';
    if (this.npmsio) {
      uri = 'https://api.npms.io/v2/search?q=keywords:coc.nvim';
    }
    let exts: ExtensionItem[] = [];
    const size = 200;
    let page = 0;
    while (true) {
      try {
        uri = `${uri}&size=${size}&from=${size * page}`;
        const resp = (await fetch(uri)) as any;
        const body = typeof resp === 'string' ? JSON.parse(resp) : resp;
        exts = exts.concat(this.format(body));

        if (page === Math.floor(body.total / size)) {
          break;
        }
        page += 1;
      } catch (_e) {
        break;
      }
    }
    statusItem.hide();

    return Promise.resolve(exts);
  }

  private format(body: any): ExtensionItem[] {
    const exts: ExtensionItem[] = [];
    let results = body.objects;
    if (this.npmsio) {
      results = body.results;
    }
    for (const item of results) {
      const pkg = item.package;
      if (pkg.name === 'coc.nvim' || pkg.name === 'coc-marketplace') {
        continue;
      }

      let sign = '';
      if (pkg.publisher.username === 'chemzqm' || pkg.publisher.email === 'chemzqm@gmail.com') {
        sign = '*';
      }

      let rtp = '';
      let status = '×';
      let isInstalled = false;
      for (const e of this.installed) {
        if (e.id === pkg.name) {
          status = '√';
          isInstalled = true;
          rtp = e.isLocal ? ' [RTP]' : '';
          break;
        }
      }

      exts.push({
        name: pkg.name,
        label: `[${status}] ${pkg.name}${sign} ${pkg.version}${rtp}`.padEnd(40) + pkg.description,
        homepage: pkg.links.homepage ? pkg.links.homepage : pkg.links.npm,
        installed: isInstalled
      });
    }

    return exts;
  }

  public doHighlight(): void {
    const { nvim } = this;
    nvim.pauseNotification();
    nvim.command('syntax match CocMarketplaceExtName /\\v%5v\\S+/', true);
    nvim.command('syntax match CocMarketplaceExtStatus /\\v^\\[[√×\\*]\\]/', true);
    nvim.command('syntax match CocMarketplaceExtVersion /\\v\\d+(\\.\\d+)*/', true);
    nvim.command('syntax match CocMarketplaceExtDescription /\\v%40v.*$/', true);
    nvim.command('highlight default link CocMarketplaceExtName String', true);
    nvim.command('highlight default link CocMarketplaceExtStatus Type', true);
    nvim.command('highlight default link CocMarketplaceExtVersion Tag', true);
    nvim.command('highlight default link CocMarketplaceExtDescription Comment', true);
    nvim.resumeNotification().catch(() => {
      // noop
    });
  }
}
