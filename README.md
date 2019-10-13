# Play around with Github actions

#### General Safety Checks
```yml
name: build-check

on:
  # trigger on PRs.
  # `opened` is when the PR is opend
  # `synchronize` is when any additional pushes are made to the PR
  pull_request:
    types: [opened, synchronize]

  # trigger on branch push
  # only trigger on pushes to the `master` and `develop` branches (this also means PR merges)
  # we can also ignore them if they only contain documentation changes
  push:
    branches:
      - master
      - develop
    paths-ignore:
      - 'docs/**'
      - '**.md'

jobs:
  # If the job does NOT have any `needs` jobs, then they are ran in parallel
  # Run ESLint over the code base
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Linter
        run: npm run lint

  # Run all of the unit tests
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Unit Tests
        run: npm run test:cov

  # If `lint` and `test` pass (this is the `needs` line)
  # then check the actual compiling
  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Build
        run: npm run build
```

#### Publish on New Tags
```yml
name: publish

# Trigger the publish on tag pushes
# You can also use
#  release:
#    types: [published]
# But this requires you to manual make a new release from Github
on:
  push:
    tags:
      - v*

jobs:
  # Run ESLint over the code base
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Linter
        run: npm run lint

  # Run all of the unit tests
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Unit Tests
        run: npm run test:cov

  # If `lint` and `test` pass (this is the `needs` line)
  # then check the actual compiling
  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm ci
      - name: Run Build
        run: npm run build

  # If `build` passes, publish to Github Pkg Reg
  publish-gpr:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Git Checkout
        uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
          registry-url: https://npm.pkg.github.com/
          scope: '@belsrc'
      - name: Publish Package @ Github
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}

  # If `build` passes, publish to NPM Pkg Reg
#  publish-npm:
#    needs: build
#    runs-on: ubuntu-latest
#    steps:
#      - name: Git Checkout
#        uses: actions/checkout@v1
#      - name: Setup Node
#        uses: actions/setup-node@v1
#        with:
#          node-version: 10
#          registry-url: https://registry.npmjs.org/
#          scope: '@belsrc'
#      - run: npm ci
#      - run: npm publish
#        env:
#          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

#### Addition to Test Job for CodeCov Reports
```yml
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v1.0.2
        with:
          token: ${{secrets.CODECOV_TOKEN}}
```
