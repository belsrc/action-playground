# Play around with Github actions

[![Build Status](https://github.com/belsrc/action-playground/workflows/build-check/badge.svg)](https://github.com/belsrc/action-playground/actions)

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
      - name: Git Checkout
        uses: actions/checkout@v1

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
      - name: Git Checkout
        uses: actions/checkout@v1

      - name: Setup Node
        uses: actions/setup-node@v1
        with:
          node-version: 10

      - name: Install Packages
        run: npm ci

      - name: Run Unit Tests
        run: npm run coverage

  # If `lint` and `test` pass (this is the `needs` line)
  # then check the actual compiling
  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    steps:
      - name: Git Checkout
        uses: actions/checkout@v1

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
# But this requires you to make a new release from Github
on:
  push:
    tags:
      - v*.*.*

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
        run: npm ci

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
        run: npm ci

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
        run: npm ci

      - name: Run Build
        run: npm run build

      - name: Publish Package @ Github
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}

      - name: Create Release
        uses: softprops/action-gh-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  # # Publish to NPM Pkg Reg
  # publish-npm:
  #   needs: [test, lint]
  #   runs-on: ubuntu-latest
  #   steps:
  #     - name: Git Checkout
  #       uses: actions/checkout@v1
  #
  #     - name: Setup Node
  #       uses: actions/setup-node@v1
  #       with:
  #         node-version: 10
  #         registry-url: https://npm.pkg.github.com/
  #         scope: '@belsrc'
  #
  #     - name: Install Packages
  #       run: npm ci
  #
  #     - name: Run Build
  #       run: npm run build
  #
  #     - name: Publish Package @ NPM
  #       run: npm publish
  #       env:
  #         NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
  #
  #     - name: Create Release
  #       uses: softprops/action-gh-release@v1
  #       env:
  #         GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
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

For Yarn you will need to use an Action from the marketplace, Borales/actions-yarn.

```yml
- name: Install Packages
  uses: Borales/actions-yarn@v2.0.1
  with:
    cmd: install

- name: Run Linter
  uses: Borales/actions-yarn@v2.0.1
  with:
    cmd: run lint
```

Though, admittedly, I've found it easier to just use npm for most of the actions.

**Edit:** It's actually easier, with less odd behavior, to just use an explicit approach instead of the above Yarn action.

```yml
lint:
  runs-on: ubuntu-latest
  steps:
    - name: Git Checkout
      uses: actions/checkout@v1

    - name: Setup Node
      uses: actions/setup-node@v1
      with:
        node-version: 10

    - name: Install Yarn
      run: npm i -g yarn

    - name: Install Packages
      run: yarn install

    - name: Run Linter
      run: yarn run lint
```

#### Commiting Action changes

If you want to back commit any changes that occured in the actions (linting/prettier) you can use the `ad-m/github-push-action` action.
In order to use it on branches dynamically, you will also need to pull out the branch name from the ref.
It would probably also be a good idea to check to see if any files were actually modified in the previous step.
This will avoid the "nothing to commit, working tree clean" if you try to commit nothing.
If it doesn't need to be dynamic, you can remove the `Extract Branch Name` step and hard code the `branch` in the `Push Changes` step.

[Example Commit](https://github.com/belsrc/action-playground/commit/0a7ac2ad1b9449f32704e508c0189255f71706a5)

[Action Ouput With Change Files](https://github.com/belsrc/action-playground/commit/586edfe1eeeea2fa92ffacef86a35e7f033acfb6/checks?check_suite_id=328143331)

[Action Output When Theres Nothing Changed](https://github.com/belsrc/action-playground/commit/ea8042bd61ee3c373a7e84157395711822958ad7/checks?check_suite_id=328154873)

```yml
clean:
  runs-on: ubuntu-latest
  steps:
    - name: Git Checkout
      uses: actions/checkout@v1

    - name: Setup Node
      uses: actions/setup-node@v1
      with:
        node-version: 10

    - name: Install Packages
      run: npm ci

    - name: Run Prettier
      run: npm run prettier

    - name: Run Linter
      run: npm run lint

    - name: Extract Branch Name
        shell: bash
        run: |
          echo ${GITHUB_REF#refs/heads/}
          echo "##[set-output name=branch;]$(echo ${GITHUB_REF#refs/heads/})"
        id: extract_branch

    - name: Count Changed Files
        shell: bash
        run: |
          git status -s -uno | wc -l
          echo "##[set-output name=count;]$(git status -s -uno | wc -l)"
        id: changed_count

    - name: Commit Files
      if: steps.changed_count.outputs.count > 0
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git commit -m "style: prettier & eslint changes" -a --no-verify

    - name: Push Changes
      if: steps.changed_count.outputs.count > 0
      uses: ad-m/github-push-action@master
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        branch: ${{ steps.extract_branch.outputs.branch }}
```
