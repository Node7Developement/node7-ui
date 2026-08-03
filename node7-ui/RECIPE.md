# NODE7 UI Recipe

Package version: **1.4.1**

The included txAdmin recipe installs `node7-ui`, writes `node7-ui.cfg`, appends it to `server.cfg`, loads ACE permissions, and ensures the resource.

```cfg
exec @node7-ui/permissions.cfg
ensure node7-ui
```

The GitHub repository expected by the recipe is:

```text
https://github.com/Node7Developement/node7-ui
```
