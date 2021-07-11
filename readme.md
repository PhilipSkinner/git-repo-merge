# Git-Repo-Merge

Utility for merging git repositories together.

Basic usage:

```
$> sudo npm i -g git-repo-merge
$> git-repo-merge --merge --include=../path/to/source/repo/root --target=./path/in/new/repo
```

## Limitations/caveats

This is a utility I wrote quickly to make my life easier when creating a monorepo from many different repositories, it may not deal with all situations and it certainly doesn't do anything intelligent like work out if the directory you are targetting is within a git repo etc.