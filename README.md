# coc-marketplace

[coc.nvim][1] extensions marketplace.

* search `coc.nvim` from npmjs.com, display extensions in `coc-list`
* `install` action
* extension name ends with `√` means installed already
* extension name ends with `*` is published by @chemzqm, IMO, is official

![coc-marketplace](https://i.loli.net/2019/06/03/5cf5049a0843a89297.png)

## Required

* `coc.nvim`
* `coc-lists` for UI.

## Install

`:CocInstall coc-marketplace`

## Usage

* `:CocList marketplace` list all available extensions
* `:CocList marketplace python` to search extension that name contains `python`

To uninstall extensions, use `:CocList extensions`.

## License

MIT

[1]: https://github.com/neoclide/coc.nvim
