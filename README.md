# coc-marketplace

[coc.nvim][1] extensions marketplace.

* search `keywords:coc.nvim` from npmjs.com, display extensions in `coc-lists`
* extension name starts with `√` means installed already, with an `uninstall` action
* extension name starts with `x` means uninstalled, with an `install` action
* extension name ends with `*` is published by @chemzqm, IMO, is official

![coc-marketplace](https://i.loli.net/2019/06/06/5cf885c18736a85017.png)

## Install

`:CocInstall coc-marketplace`

## Usage

* `:CocList marketplace` list all available extensions
* `:CocList marketplace python` to search extension that name contains `python`

## License

MIT

[1]: https://github.com/neoclide/coc.nvim
