# Play around with Github actions

[![Build Status](https://github.com/belsrc/action-playground/workflows/build-check/badge.svg)](https://github.com/belsrc/action-playground/actions)
[![Maintainability](https://img.shields.io/codeclimate/maintainability/belsrc/action-playground.svg?logo=code%20climate&logoWidth=14&style=flat-square)](https://codeclimate.com/github/belsrc/action-playground/maintainability)
[![Code Coverage](https://img.shields.io/codeclimate/coverage/belsrc/action-playground?logo=code%20climate&style=flat-square)](https://codeclimate.com/github/belsrc/action-playground/test_coverage)

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
        run: npm i --no-audit --no-package-lock --no-optional
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
        run: npm i --no-audit --no-package-lock --no-optional
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
        run: npm i --no-audit --no-package-lock --no-optional
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
      - name: Git Checkout
        uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm i --no-audit --no-package-lock --no-optional
      - name: Run Linter
        run: npm run lint

  # Run all of the unit tests
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Git Checkout
        uses: actions/checkout@v1
      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10
      - name: Install Packages
        run: npm i --no-audit --no-package-lock --no-optional
      - name: Run Unit Tests
        run: npm run test:cov

  # If `lint` and `test` pass, build and publish to Github Pkg Reg
  publish-gpr:
    needs: [test, lint]
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
      - name: Install Packages
        run: npm i --no-audit --no-package-lock --no-optional
      - name: Run Build
        run: npm run build
      - name: Publish Package @ Github
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}
  # # If `lint` and `test` pass, build and publish to NPM Pkg Reg
  # publish-npm:
  #   needs: build
  #   runs-on: ubuntu-latest
  #   steps:
  #     - name: Git Checkout
  #       uses: actions/checkout@v1
  #     - name: Setup Node
  #       uses: actions/setup-node@v1
  #       with:
  #         node-version: 10
  #         registry-url: https://registry.npmjs.org/
  #         scope: '@belsrc'
  #     - run: npm i --no-audit --no-package-lock --no-optional
  #     - name: Publish Package @ NPM
  #       run: npm publish
  #       env:
  #         NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

#### Addition to Test Job for CodeCov Reports

```yml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v1.0.2
  with:
    token: ${{secrets.CODECOV_TOKEN}}
```

#### Addition to Test Job for CodeClimate coverage Reports

```yml
- name: Upload coverage to CodeClimate
  run: |
    export GIT_BRANCH="${GITHUB_REF/refs\/heads\//}"
    curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
    chmod +x ./cc-test-reporter
    ./cc-test-reporter format-coverage -t lcov coverage/lcov.info
    ./cc-test-reporter upload-coverage
  env:
    CC_TEST_REPORTER_ID: ${{secrets.CC_TEST_REPORTER_ID}}
```

#### Yarn Use

So far Ive only been able to find one Yarn action. And while using you that you dont have acess to `npm run` so one would need to use the node action as well.

```yml
- name: Setup Node
  uses: actions/setup-node@v1
  with:
    node-version: 10
- name: Install Packages
  uses: Borales/actions-yarn@v2.0.1
  with:
    cmd: install
```

All that being said, its actually significantly faster to just use `npm install` (as you cant use `npm ci` unless you have a package-lock)

```yml
- name: Setup Node
  uses: actions/setup-node@v1
  with:
    node-version: 10
- name: Install Packages
  run: npm i --no-audit --no-package-lock --no-optional
```
